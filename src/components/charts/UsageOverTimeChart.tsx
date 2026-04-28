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
import { formatTokens } from '@/lib/format';

interface DailyData {
  date: string;
  tokens: number;
  sessions: number;
  cost: number;
}

interface Props {
  data: DailyData[];
}

export function UsageOverTimeChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => String(v).slice(5)}
        />
        <YAxis
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(v) => typeof v === 'number' ? formatTokens(v) : String(v)}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#F9FAFB' }}
          itemStyle={{ color: '#9CA3AF' }}
          formatter={(value) => [typeof value === 'number' ? formatTokens(value) : String(value ?? 0), 'Tokens']}
        />
        <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="tokens"
          name="Daily Tokens"
          stroke="#3B82F6"
          fill="url(#colorTokens)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
