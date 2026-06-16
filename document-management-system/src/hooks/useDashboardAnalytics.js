import { useState, useEffect, useMemo } from 'react';
import { documentService } from '../services/documentService';
import { userService } from '../services/userService';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Group documents by a date key (day label 'YYYY-MM-DD' or week 'YYYY-Www').
 */
function groupByDate(docs, granularity = 'day') {
  const map = {};
  docs.forEach(doc => {
    const d = new Date(doc.createdAt);
    let key;
    if (granularity === 'week') {
      // ISO week: YYYY-Www
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
      key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
    } else {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    map[key] = (map[key] || 0) + 1;
  });

  // Sort chronologically and return as array
  return Object.entries(map)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

/**
 * Get last N days of upload activity (fills in 0s for missing days).
 */
function getRecentDailyActivity(docs, days = 30) {
  const now = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: 0 });
  }
  docs.forEach(doc => {
    const key = new Date(doc.createdAt).toISOString().slice(0, 10);
    const entry = result.find(r => r.date === key);
    if (entry) entry.count++;
  });
  return result;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

/**
 * useDashboardAnalytics
 * Fetches users, documents, and categories then computes aggregated metrics
 * client-side using useMemo.
 */
export function useDashboardAnalytics() {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, docsData, catsData, deptsData] = await Promise.all([
        userService.getUsers(),
        documentService.getDocuments(),
        documentService.getCategories(),
        documentService.getDepartments(),
      ]);
      setUsers(usersData);
      setDocuments(docsData);
      setCategories(catsData);
      setDepartments(deptsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Top-level KPIs ────────────────────────────────────────────────────────
  const totalUsers = useMemo(() => users.length, [users]);
  const activeUsers = useMemo(() => users.filter(u => u.status === 'active').length, [users]);
  const suspendedUsers = useMemo(() => users.filter(u => u.status === 'suspended').length, [users]);
  const adminCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);

  const totalDocuments = useMemo(() => documents.length, [documents]);
  const publishedDocuments = useMemo(() => documents.filter(d => d.status === 'published').length, [documents]);
  const draftDocuments = useMemo(() => documents.filter(d => d.status === 'draft').length, [documents]);

  const totalStorageBytes = useMemo(
    () => documents.reduce((sum, d) => sum + (d.fileSize || 0), 0),
    [documents]
  );
  const totalStorageFormatted = useMemo(() => formatBytes(totalStorageBytes), [totalStorageBytes]);

  const totalViews = useMemo(() => documents.reduce((s, d) => s + (d.viewCount || 0), 0), [documents]);
  const totalDownloads = useMemo(() => documents.reduce((s, d) => s + (d.downloadCount || 0), 0), [documents]);

  // ── Time-series data ──────────────────────────────────────────────────────
  const dailyActivity = useMemo(() => getRecentDailyActivity(documents, 30), [documents]);
  const weeklyActivity = useMemo(() => groupByDate(documents, 'week'), [documents]);

  // Documents uploaded in last 7 days vs previous 7 days (for trend %)
  const last7DaysCount = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return documents.filter(d => new Date(d.createdAt) >= cutoff).length;
  }, [documents]);

  const prev7DaysCount = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() - 7);
    const start = new Date();
    start.setDate(start.getDate() - 14);
    return documents.filter(d => {
      const c = new Date(d.createdAt);
      return c >= start && c < end;
    }).length;
  }, [documents]);

  const uploadTrend = useMemo(() => {
    if (prev7DaysCount === 0) return last7DaysCount > 0 ? 100 : 0;
    return Math.round(((last7DaysCount - prev7DaysCount) / prev7DaysCount) * 100);
  }, [last7DaysCount, prev7DaysCount]);

  // ── Category distribution ─────────────────────────────────────────────────
  const categoryDistribution = useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      const cat = categories.find(c => c.id === doc.categoryId);
      const label = cat ? `${cat.icon || ''} ${cat.name}`.trim() : 'Uncategorized';
      if (!map[label]) map[label] = { name: label, count: 0, storageBytes: 0 };
      map[label].count++;
      map[label].storageBytes += doc.fileSize || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [documents, categories]);

  // ── Department distribution ───────────────────────────────────────────────
  const departmentDistribution = useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      const dept = departments.find(d => d.id === doc.departmentId);
      const label = dept?.name || 'Global';
      if (!map[label]) map[label] = { name: label, count: 0, storageBytes: 0 };
      map[label].count++;
      map[label].storageBytes += doc.fileSize || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [documents, departments]);

  // ── File type distribution ────────────────────────────────────────────────
  const fileTypeDistribution = useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      const type = doc.fileType?.toUpperCase() || 'OTHER';
      if (!map[type]) map[type] = { name: type, count: 0, storageBytes: 0 };
      map[type].count++;
      map[type].storageBytes += doc.fileSize || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [documents]);

  // ── Top documents ─────────────────────────────────────────────────────────
  const topViewedDocuments = useMemo(
    () => [...documents].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5),
    [documents]
  );
  const topDownloadedDocuments = useMemo(
    () => [...documents].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5),
    [documents]
  );

  // ── User activity ─────────────────────────────────────────────────────────
  const newUsersLast30Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return users.filter(u => new Date(u.createdAt) >= cutoff).length;
  }, [users]);

  return {
    // Raw data
    users,
    documents,
    categories,
    departments,

    // State
    isLoading,
    error,
    lastUpdated,
    refetch: fetchAll,

    // KPIs
    totalUsers,
    activeUsers,
    suspendedUsers,
    adminCount,
    totalDocuments,
    publishedDocuments,
    draftDocuments,
    totalStorageBytes,
    totalStorageFormatted,
    totalViews,
    totalDownloads,
    last7DaysCount,
    uploadTrend,
    newUsersLast30Days,

    // Chart data
    dailyActivity,
    weeklyActivity,
    categoryDistribution,
    departmentDistribution,
    fileTypeDistribution,

    // Top lists
    topViewedDocuments,
    topDownloadedDocuments,
  };
}
