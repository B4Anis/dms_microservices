import React, { useState } from 'react';
import { useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import ActivityHeatmap from '../../components/admin/charts/ActivityHeatmap';
import CategoryPieChart from '../../components/admin/charts/CategoryPieChart';
import StorageHealthWidget from '../../components/admin/StorageHealthWidget';
import AIInsightsWidget from '../../components/admin/AIInsightsWidget';

// ─────────────────────────────────────────────
// Skeleton components
// ─────────────────────────────────────────────
const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 p-5 animate-pulse ${className}`}>
    <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-2 bg-gray-100 rounded w-2/3" />
  </div>
);

const SkeletonChart = ({ height = 280 }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-1/4 mb-6" />
    <div className="bg-gray-100 rounded-xl" style={{ height }} />
  </div>
);

// ─────────────────────────────────────────────
// KPI metric card
// ─────────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, trend, trendLabel, accentClass = 'bg-blue-100 text-blue-600' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === undefined;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${accentClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {sub && <span className="text-xs text-gray-400">{sub}</span>}
          {!isNeutral && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
              {trendLabel && <span className="font-normal text-gray-400 ml-1">{trendLabel}</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Section card wrapper
// ─────────────────────────────────────────────
const SectionCard = ({ title, subtitle, children, action, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ─────────────────────────────────────────────
// Top Documents table (compact)
// ─────────────────────────────────────────────
const TopDocTable = ({ docs = [], metric = 'viewCount', label = 'Views' }) => (
  <div className="space-y-2">
    {docs.map((doc, i) => (
      <div key={doc.id} className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {i + 1}
        </span>
        <p className="text-xs text-gray-700 flex-1 truncate">{doc.title}</p>
        <span className="text-xs font-bold text-gray-600 flex-shrink-0">
          {doc[metric] || 0} <span className="text-gray-400 font-normal">{label}</span>
        </span>
      </div>
    ))}
    {docs.length === 0 && (
      <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
    )}
  </div>
);

// ─────────────────────────────────────────────
// Chart toggle button
// ─────────────────────────────────────────────
const ToggleButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
const AdminDashboard = () => {
  const analytics = useDashboardAnalytics();
  const [pieMode, setPieMode] = useState('category'); // 'category' | 'department' | 'filetype'
  const [activityMode, setActivityMode] = useState('daily'); // 'daily' | 'weekly'

  const {
    isLoading,
    error,
    lastUpdated,
    refetch,

    totalUsers,
    activeUsers,
    suspendedUsers,
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

    dailyActivity,
    weeklyActivity,
    categoryDistribution,
    departmentDistribution,
    fileTypeDistribution,

    topViewedDocuments,
    topDownloadedDocuments,
  } = analytics;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonChart height={280} />
          <SkeletonChart height={280} />
          <SkeletonChart height={280} />
        </div>
        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonChart height={240} />
          <SkeletonChart height={240} />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-center">
        <span className="text-4xl mb-3">⚠️</span>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Failed to load analytics</h2>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const pieData =
    pieMode === 'category'
      ? categoryDistribution
      : pieMode === 'department'
      ? departmentDistribution
      : fileTypeDistribution;

  const pieTitle =
    pieMode === 'category' ? 'By Category' : pieMode === 'department' ? 'By Department' : 'By File Type';

  const activityData = activityMode === 'daily' ? dailyActivity : weeklyActivity;

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time system overview
            {lastUpdated && (
              <span className="ml-2 text-gray-400">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── TOP ROW: KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon="👥"
          label="Total Users"
          value={totalUsers.toLocaleString()}
          sub={`${activeUsers} active · ${suspendedUsers} suspended`}
          accentClass="bg-blue-100 text-blue-600"
        />
        <MetricCard
          icon="📄"
          label="Total Documents"
          value={totalDocuments.toLocaleString()}
          sub={`${publishedDocuments} published · ${draftDocuments} drafts`}
          trend={uploadTrend}
          trendLabel="vs last week"
          accentClass="bg-indigo-100 text-indigo-600"
        />
        <MetricCard
          icon="💾"
          label="Storage Used"
          value={totalStorageFormatted}
          sub={`${totalDocuments} files total`}
          accentClass="bg-purple-100 text-purple-600"
        />
        <MetricCard
          icon="📊"
          label="Total Views"
          value={totalViews.toLocaleString()}
          sub={`${totalDownloads} downloads`}
          accentClass="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* ── MIDDLE ROW: Charts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity Heatmap — spans 2 columns */}
        <SectionCard
          title="Upload Activity"
          subtitle="Document uploads over time"
          className="lg:col-span-2"
          action={
            <div className="flex gap-1">
              <ToggleButton active={activityMode === 'daily'} onClick={() => setActivityMode('daily')}>Daily</ToggleButton>
              <ToggleButton active={activityMode === 'weekly'} onClick={() => setActivityMode('weekly')}>Weekly</ToggleButton>
            </div>
          }
        >
          <ActivityHeatmap data={activityData} height={240} />
        </SectionCard>

        {/* Category Pie — 1 column */}
        <SectionCard
          title="Distribution"
          subtitle={pieTitle}
          action={
            <div className="flex gap-1 flex-wrap">
              <ToggleButton active={pieMode === 'category'} onClick={() => setPieMode('category')}>Cat</ToggleButton>
              <ToggleButton active={pieMode === 'department'} onClick={() => setPieMode('department')}>Dept</ToggleButton>
              <ToggleButton active={pieMode === 'filetype'} onClick={() => setPieMode('filetype')}>Type</ToggleButton>
            </div>
          }
        >
          <CategoryPieChart data={pieData} title={pieTitle} />
        </SectionCard>
      </div>

      {/* ── BOTTOM ROW ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Documents */}
        <SectionCard
          title="Top Documents"
          subtitle="Most viewed this month"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Most Viewed</p>
              <TopDocTable docs={topViewedDocuments} metric="viewCount" label="views" />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Most Downloaded</p>
              <TopDocTable docs={topDownloadedDocuments} metric="downloadCount" label="downloads" />
            </div>
          </div>
        </SectionCard>

        {/* AI Insights */}
        <div className="lg:col-span-1">
          <AIInsightsWidget
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            suspendedUsers={suspendedUsers}
            totalDocuments={totalDocuments}
            publishedDocuments={publishedDocuments}
            draftDocuments={draftDocuments}
            totalStorageBytes={totalStorageBytes}
            totalStorageFormatted={totalStorageFormatted}
            last7DaysCount={last7DaysCount}
            uploadTrend={uploadTrend}
            newUsersLast30Days={newUsersLast30Days}
            categoryDistribution={categoryDistribution}
            departmentDistribution={departmentDistribution}
            topViewedDocuments={topViewedDocuments}
            dailyActivity={dailyActivity}
          />
        </div>

        {/* System Health */}
        <div className="lg:col-span-1">
          <StorageHealthWidget storageUsedBytes={totalStorageBytes} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
