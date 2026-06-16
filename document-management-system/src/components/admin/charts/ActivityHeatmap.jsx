import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="font-semibold mb-1 text-gray-300">{label}</p>
      <p className="text-blue-300 font-bold">{payload[0].value} upload{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// ActivityHeatmap — Area Chart
// ─────────────────────────────────────────────

/**
 * Props:
 *   data: { date: string, count: number }[]  — chronological daily upload counts
 *   title?: string
 *   height?: number
 */
const ActivityHeatmap = ({ data = [], title = 'Document Upload Activity', height = 260 }) => {
  // Format x-axis labels to show short date
  const formatXAxis = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalUploads = data.reduce((s, d) => s + d.count, 0);
  const avgPerDay = data.length > 0 ? (totalUploads / data.length).toFixed(1) : 0;

  // Determine tick interval to avoid overcrowding
  const tickInterval = data.length > 20 ? Math.floor(data.length / 10) : 0;

  return (
    <div className="w-full">
      {/* Sub-header stats */}
      <div className="flex gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalUploads}</p>
          <p className="text-xs text-gray-500">Total uploads</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div>
          <p className="text-2xl font-bold text-gray-900">{avgPerDay}</p>
          <p className="text-xs text-gray-500">Avg per day</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div>
          <p className="text-2xl font-bold text-gray-900">{maxCount}</p>
          <p className="text-xs text-gray-500">Peak day</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            interval={tickInterval}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {avgPerDay > 0 && (
            <ReferenceLine
              y={parseFloat(avgPerDay)}
              stroke="#94a3b8"
              strokeDasharray="4 2"
              label={{ value: 'avg', position: 'right', fontSize: 9, fill: '#94a3b8' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#activityGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityHeatmap;
