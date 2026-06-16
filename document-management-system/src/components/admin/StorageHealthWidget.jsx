import React from 'react';

// ─────────────────────────────────────────────
// Simulated infrastructure metrics
// (These would come from a real monitoring API in production)
// ─────────────────────────────────────────────
const INFRA_METRICS = {
  pvcTotal: 100,       // GB
  pvcUsed: 45,         // GB
  dbNodeStatus: 'healthy',   // 'healthy' | 'degraded' | 'down'
  replicaStatus: 'healthy',
  apiLatencyMs: 38,    // ms
  cacheHitRate: 94,    // %
  uptimePercent: 99.97,
  lastBackup: '2026-04-18T01:00:00Z',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function pvcColor(pct) {
  if (pct >= 90) return { bar: 'bg-red-500', text: 'text-red-700', label: 'Critical' };
  if (pct >= 70) return { bar: 'bg-yellow-400', text: 'text-yellow-700', label: 'Warning' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'Healthy' };
}

function latencyColor(ms) {
  if (ms > 200) return 'text-red-600';
  if (ms > 100) return 'text-yellow-600';
  return 'text-emerald-600';
}

function statusDot(status) {
  const colors = {
    healthy: 'bg-emerald-400',
    degraded: 'bg-yellow-400',
    down: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-400';
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const GaugeBar = ({ label, used, total, unit = 'GB' }) => {
  const pct = Math.min((used / total) * 100, 100);
  const colors = pvcColor(pct);
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-bold ${colors.text}`}>
          {colors.label} — {pct.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{used} {unit} used</span>
        <span>{total} {unit} total</span>
      </div>
    </div>
  );
};

const StatusRow = ({ label, status, extra }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(status)} animate-pulse`} />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
    <div className="text-right">
      <span className={`text-xs font-semibold capitalize ${
        status === 'healthy' ? 'text-emerald-600' : status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {status}
      </span>
      {extra && <p className="text-[10px] text-gray-400 mt-0.5">{extra}</p>}
    </div>
  </div>
);

const MetricTile = ({ label, value, sub, valueClass = '' }) => (
  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
    <p className="text-xs text-gray-600 font-medium mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// ─────────────────────────────────────────────
// Main Widget
// ─────────────────────────────────────────────

const StorageHealthWidget = ({ storageUsedBytes = 0 }) => {
  const m = INFRA_METRICS;
  // Derive real PVC usage from actual document storage
  const pvcUsedGB = Math.max(m.pvcUsed, storageUsedBytes / 1024 ** 3).toFixed(1);
  const pvcPct = (pvcUsedGB / m.pvcTotal) * 100;
  const pvcColors = pvcColor(pvcPct);

  const lastBackupDate = new Date(m.lastBackup).toLocaleString();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🖥️</div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">System Health</h3>
            <p className="text-[10px] text-gray-500">Infrastructure metrics</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pvcColors.text} bg-opacity-20`}
          style={{ backgroundColor: pvcPct >= 90 ? '#fee2e2' : pvcPct >= 70 ? '#fef9c3' : '#d1fae5' }}>
          {pvcColors.label}
        </span>
      </div>

      {/* PVC Gauge */}
      <div className="mb-5">
        <GaugeBar label="Persistent Volume Claim (PVC)" used={pvcUsedGB} total={m.pvcTotal} unit="GB" />
      </div>

      {/* Cache hit rate */}
      <div className="mb-5">
        <GaugeBar label="Cache Hit Rate" used={m.cacheHitRate} total={100} unit="%" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <MetricTile
          label="API Latency"
          value={`${m.apiLatencyMs}ms`}
          valueClass={latencyColor(m.apiLatencyMs)}
        />
        <MetricTile
          label="Uptime"
          value={`${m.uptimePercent}%`}
          valueClass="text-emerald-600"
        />
        <MetricTile
          label="Backup"
          value="✓ OK"
          sub={lastBackupDate.split(',')[0]}
          valueClass="text-emerald-600"
        />
      </div>

      {/* Node status */}
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Node Status</p>
        <StatusRow label="Primary Database" status={m.dbNodeStatus} extra="PostgreSQL 15.3" />
        <StatusRow label="Replica Node" status={m.replicaStatus} extra="Read replica" />
        <StatusRow
          label="API Gateway"
          status={m.apiLatencyMs < 100 ? 'healthy' : m.apiLatencyMs < 200 ? 'degraded' : 'down'}
          extra={`${m.apiLatencyMs}ms avg`}
        />
        <StatusRow label="Search Index" status="healthy" extra="Elasticsearch" />
      </div>
    </div>
  );
};

export default StorageHealthWidget;
