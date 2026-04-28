'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCost } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';

interface SessionBar {
  name: string;
  cost: number;
  primaryModel: string;
}

interface Props {
  data: SessionBar[];
}

export function TopSessionsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data</div>;
  }

  const truncate = (s: string, n = 28) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => typeof v === 'number' ? formatCost(v) : String(v)}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => truncate(String(v))}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#F9FAFB' }}
          formatter={(value) => [typeof value === 'number' ? formatCost(value) : String(value ?? 0), 'Est. Cost']}
        />
        <Bar dataKey="cost" name="Est. Cost" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getModelColor(entry.primaryModel)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
