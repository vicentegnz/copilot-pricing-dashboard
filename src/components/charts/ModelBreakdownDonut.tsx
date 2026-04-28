'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCost } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';

interface ModelBreakdown {
  model: string;
  cost: number;
}

interface Props {
  data: ModelBreakdown[];
}

export function ModelBreakdownDonut({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data</div>;
  }

  const total = data.reduce((s, d) => s + d.cost, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="cost"
          nameKey="model"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={getModelColor(entry.model)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#F9FAFB' }}
          formatter={(value, name) => [
            typeof value === 'number' ? `${formatCost(value)} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)` : String(value ?? 0),
            String(name ?? ''),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }}
          formatter={(value) => <span style={{ color: '#9CA3AF' }}>{String(value)}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
