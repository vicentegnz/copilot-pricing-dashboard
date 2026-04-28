import { getDashboardStats } from '@/lib/copilot-data/reader';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/cards/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageOverTimeChart } from '@/components/charts/UsageOverTimeChart';
import { ModelBreakdownDonut } from '@/components/charts/ModelBreakdownDonut';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { formatTokens, formatCost } from '@/lib/format';
import { BarChart3, MessageSquare, Cpu, DollarSign } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const stats = await getDashboardStats();

  const donutData = Object.entries(stats.modelBreakdown)
    .map(([model, v]) => ({ model, cost: v.cost }))
    .filter(d => d.cost > 0)
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        subtitle="High-level view of your GitHub Copilot CLI usage and costs."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          subtitle="CLI sessions recorded"
          icon={BarChart3}
        />
        <StatCard
          title="User Messages"
          value={stats.totalUserMessages.toLocaleString()}
          subtitle="Messages sent"
          icon={MessageSquare}
        />
        <StatCard
          title="Total Tokens"
          value={formatTokens(stats.totalInputTokens + stats.totalOutputTokens)}
          subtitle={`${formatTokens(stats.totalCacheReadTokens)} from cache`}
          icon={Cpu}
        />
        <StatCard
          title="Estimated Cost"
          value={formatCost(stats.totalCost)}
          subtitle="Based on public pricing"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Daily Token Usage</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <UsageOverTimeChart data={stats.dailyActivity} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelBreakdownDonut data={donutData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ActivityHeatmap data={stats.dailyActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
