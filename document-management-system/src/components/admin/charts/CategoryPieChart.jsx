import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ─────────────────────────────────────────────
// Color palette
// ─────────────────────────────────────────────
const PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// ─────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: d } = payload[0];
  return (
    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg min-w-[140px]">
      <p className="font-semibold mb-1 text-gray-200 truncate">{name}</p>
      <p className="text-blue-300 font-bold">{value} document{value !== 1 ? 's' : ''}</p>
      {d.storageBytes > 0 && (
        <p className="text-gray-400 mt-0.5">
          {(d.storageBytes / 1024 / 1024).toFixed(1)} MB
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom legend item
// ─────────────────────────────────────────────
const CustomLegend = ({ data, activeIndex, onHover, total }) => (
  <div className="space-y-1.5 mt-2">
    {data.map((entry, i) => {
      const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
      return (
        <div
          key={entry.name}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
            activeIndex === i ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
          onMouseEnter={() => onHover(i)}
          onMouseLeave={() => onHover(null)}
        >
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
          />
          <span className="text-xs text-gray-700 flex-1 truncate">{entry.name}</span>
          <span className="text-xs font-bold text-gray-600">{entry.count}</span>
          <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
        </div>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────
// CategoryPieChart — Doughnut
// ─────────────────────────────────────────────

/**
 * Props:
 *   data: { name: string, count: number, storageBytes?: number }[]
 *   title?: string
 *   emptyMessage?: string
 */
const CategoryPieChart = ({
  data = [],
  title = 'By Category',
  emptyMessage = 'No documents yet',
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data.reduce((s, d) => s + d.count, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <span className="text-4xl mb-2">📊</span>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        {/* Doughnut */}
        <div className="relative" style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
                activeIndex={activeIndex ?? undefined}
                activeShape={{
                  outerRadius: 92,
                }}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={PALETTE[index % PALETTE.length]}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-[10px] text-gray-500 font-medium">Total</p>
          </div>
        </div>

        {/* Legend */}
        <CustomLegend
          data={data}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          total={total}
        />
      </div>
    </div>
  );
};

export default CategoryPieChart;
