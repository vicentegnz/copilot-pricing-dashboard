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
    <div>
      <PageHeader title="Overview" subtitle="GitHub Copilot CLI usage analytics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          subtitle="CLI sessions recorded"
          icon={BarChart3}
          iconColor="#3B82F6"
        />
        <StatCard
          title="User Messages"
          value={stats.totalUserMessages.toLocaleString()}
          subtitle="Messages sent"
          icon={MessageSquare}
          iconColor="#10B981"
        />
        <StatCard
          title="Total Tokens"
          value={formatTokens(stats.totalInputTokens + stats.totalOutputTokens)}
          subtitle={`${formatTokens(stats.totalCacheReadTokens)} cache read`}
          icon={Cpu}
          iconColor="#8B5CF6"
        />
        <StatCard
          title="Est. Cost"
          value={formatCost(stats.totalCost)}
          subtitle="Based on public pricing"
          icon={DollarSign}
          iconColor="#D97706"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Daily Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageOverTimeChart data={stats.dailyActivity} />
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelBreakdownDonut data={donutData} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Activity Heatmap (last 52 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={stats.dailyActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
