'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCost } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';

interface DailyModelCost {
  date: string;
  [model: string]: number | string;
}

interface Props {
  data: DailyModelCost[];
  models: string[];
}

export function CostOverTimeChart({ data, models }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => String(v).slice(5)}
        />
        <YAxis
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => typeof v === 'number' ? formatCost(v) : String(v)}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#F9FAFB' }}
          formatter={(value, name) => [typeof value === 'number' ? formatCost(value) : String(value ?? 0), String(name ?? '')]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
        {models.map((model) => (
          <Area
            key={model}
            type="monotone"
            dataKey={model}
            name={model}
            stackId="1"
            stroke={getModelColor(model)}
            fill={getModelColor(model)}
            fillOpacity={0.4}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
