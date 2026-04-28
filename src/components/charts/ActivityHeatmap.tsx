'use client';

import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format';

interface DailyData {
  date: string;
  sessions: number;
}

interface Props {
  data: DailyData[];
}

function getIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-gray-800';
  const ratio = count / max;
  if (ratio < 0.25) return 'bg-blue-900';
  if (ratio < 0.5) return 'bg-blue-700';
  if (ratio < 0.75) return 'bg-blue-500';
  return 'bg-blue-400';
}

export function ActivityHeatmap({ data }: Props) {
  const grid = useMemo(() => {
    const dateMap = new Map(data.map(d => [d.date, d.sessions]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build 52 weeks × 7 days grid, ending today
    const cells: { date: string; count: number }[] = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 52 * 7 + 1);
    // Align to Sunday
    const dow = startDate.getDay();
    startDate.setDate(startDate.getDate() - dow);

    for (let i = 0; i < 52 * 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      cells.push({ date: iso, count: dateMap.get(iso) ?? 0 });
    }

    // Group into weeks (columns of 7)
    const weeks: { date: string; count: number }[][] = [];
    for (let w = 0; w < 52; w++) {
      weeks.push(cells.slice(w * 7, (w + 1) * 7));
    }
    return weeks;
  }, [data]);

  const max = Math.max(...data.map(d => d.sessions), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <Tooltip key={cell.date}>
                <TooltipTrigger >
                  <div
                    className={`w-3 h-3 rounded-sm ${getIntensity(cell.count, max)} cursor-default`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {formatDate(cell.date)}: {cell.count} session{cell.count !== 1 ? 's' : ''}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
