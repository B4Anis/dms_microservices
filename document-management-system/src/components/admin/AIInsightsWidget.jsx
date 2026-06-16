import React, { useMemo } from 'react';

// ─────────────────────────────────────────────
// Insight generators — pure functions
// ─────────────────────────────────────────────

function generateInsights({
  totalUsers,
  activeUsers,
  suspendedUsers,
  totalDocuments,
  publishedDocuments,
  draftDocuments,
  totalStorageBytes,
  totalStorageFormatted,
  last7DaysCount,
  uploadTrend,
  newUsersLast30Days,
  categoryDistribution,
  departmentDistribution,
  topViewedDocuments,
  dailyActivity,
}) {
  const insights = [];

  // ── Upload activity ────────────────────────────────────────────────────────
  if (uploadTrend > 0) {
    insights.push({
      type: 'positive',
      icon: '📈',
      title: 'Upload Activity Rising',
      body: `Document uploads have increased by ${uploadTrend}% this week (${last7DaysCount} new docs) compared to the previous 7 days.`,
    });
  } else if (uploadTrend < -10) {
    insights.push({
      type: 'warning',
      icon: '📉',
      title: 'Upload Activity Declining',
      body: `Document uploads dropped by ${Math.abs(uploadTrend)}% compared to last week. Consider sending a content reminder to active users.`,
    });
  } else if (last7DaysCount === 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'No Uploads This Week',
      body: `No documents have been uploaded in the past 7 days. Engagement may be low.`,
    });
  }

  // ── Storage concentration ──────────────────────────────────────────────────
  if (categoryDistribution.length > 0) {
    const topCat = categoryDistribution[0];
    const topPct = totalDocuments > 0
      ? Math.round((topCat.count / totalDocuments) * 100)
      : 0;
    if (topPct >= 50) {
      insights.push({
        type: 'info',
        icon: '📁',
        title: 'Storage Concentration',
        body: `The "${topCat.name}" category accounts for ${topPct}% of all documents. Consider archiving older files to balance storage.`,
      });
    }
  }

  // ── Suspended users ────────────────────────────────────────────────────────
  if (suspendedUsers > 0) {
    insights.push({
      type: 'warning',
      icon: '🔒',
      title: 'Suspended Accounts',
      body: `${suspendedUsers} user account${suspendedUsers > 1 ? 's are' : ' is'} currently suspended. Review their access status in User Management.`,
    });
  }

  // ── Draft vs Published ratio ───────────────────────────────────────────────
  const draftPct = totalDocuments > 0 ? Math.round((draftDocuments / totalDocuments) * 100) : 0;
  if (draftPct > 40) {
    insights.push({
      type: 'warning',
      icon: '📝',
      title: 'High Draft Rate',
      body: `${draftPct}% of documents (${draftDocuments}) are still in draft status. Encourage contributors to publish their work.`,
    });
  }

  // ── New user growth ────────────────────────────────────────────────────────
  if (newUsersLast30Days > 0) {
    insights.push({
      type: 'positive',
      icon: '👥',
      title: 'User Growth',
      body: `${newUsersLast30Days} new user${newUsersLast30Days > 1 ? 's' : ''} joined in the last 30 days. Platform adoption is healthy.`,
    });
  }

  // ── Top document ──────────────────────────────────────────────────────────
  if (topViewedDocuments.length > 0) {
    const top = topViewedDocuments[0];
    if ((top.viewCount || 0) > 0) {
      insights.push({
        type: 'info',
        icon: '⭐',
        title: 'Most Popular Document',
        body: `"${top.title}" has been viewed ${top.viewCount} times and downloaded ${top.downloadCount || 0} times — your most accessed document.`,
      });
    }
  }

  // ── Storage size ──────────────────────────────────────────────────────────
  const gbUsed = totalStorageBytes / 1024 ** 3;
  if (gbUsed > 80) {
    insights.push({
      type: 'critical',
      icon: '🚨',
      title: 'Critical Storage Usage',
      body: `Storage is at ${gbUsed.toFixed(1)} GB. You are approaching capacity limits. Archive or delete unused documents immediately.`,
    });
  } else if (gbUsed > 50) {
    insights.push({
      type: 'warning',
      icon: '💾',
      title: 'Storage Usage High',
      body: `${totalStorageFormatted} of storage is currently in use. Plan for expansion or begin archiving large files.`,
    });
  }

  // ── Department spread ──────────────────────────────────────────────────────
  if (departmentDistribution.length === 1 && totalDocuments > 10) {
    insights.push({
      type: 'info',
      icon: '🏢',
      title: 'Department Concentration',
      body: `All documents are stored under a single department. Consider expanding usage across other departments.`,
    });
  }

  // ── All healthy ────────────────────────────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      icon: '✅',
      title: 'All Systems Healthy',
      body: 'No anomalies detected. Document activity, user counts, and storage are all within normal ranges.',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────
// Style maps
// ─────────────────────────────────────────────
const INSIGHT_STYLES = {
  positive: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    title: 'text-emerald-900',
    body: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Insight',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
    title: 'text-blue-900',
    body: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Info',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    title: 'text-amber-900',
    body: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Warning',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    title: 'text-red-900',
    body: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const AIInsightsWidget = (props) => {
  const insights = useMemo(() => generateInsights(props), [
    props.totalUsers,
    props.activeUsers,
    props.suspendedUsers,
    props.totalDocuments,
    props.publishedDocuments,
    props.draftDocuments,
    props.totalStorageBytes,
    props.last7DaysCount,
    props.uploadTrend,
    props.newUsersLast30Days,
    props.categoryDistribution,
    props.departmentDistribution,
    props.topViewedDocuments,
  ]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-base">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI Insights</h3>
            <p className="text-[10px] text-gray-500">Automated analysis of system data</p>
          </div>
        </div>
        <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Insights list */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {insights.map((insight, i) => {
          const s = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.info;
          return (
            <div
              key={i}
              className={`${s.bg} ${s.border} border rounded-xl p-3.5 flex gap-3`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`text-xs font-bold ${s.title}`}>{insight.title}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.badge}`}>
                    {s.label}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${s.body}`}>{insight.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100 text-center">
        Insights generated from live data • Refreshes on page load
      </p>
    </div>
  );
};

export default AIInsightsWidget;
