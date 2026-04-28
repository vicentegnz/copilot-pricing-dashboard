import { getDashboardStats, getAllSessions } from '@/lib/copilot-data/reader';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CostOverTimeChart } from '@/components/charts/CostOverTimeChart';
import { TopSessionsChart } from '@/components/charts/TopSessionsChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCost, formatTokens } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  const [stats, sessions] = await Promise.all([getDashboardStats(), getAllSessions()]);

  const models = Object.keys(stats.modelBreakdown).filter(m => stats.modelBreakdown[m].cost > 0);
  const totalCost = stats.totalCost;

  // Build daily per-model cost data
  const dailyCostMap: Record<string, Record<string, number>> = {};
  for (const session of sessions) {
    const date = session.startTime.slice(0, 10);
    if (!dailyCostMap[date]) dailyCostMap[date] = {};
    for (const [model, mu] of Object.entries(session.modelMetrics)) {
      dailyCostMap[date][model] = (dailyCostMap[date][model] ?? 0) + mu.cost;
    }
  }

  const dailyCostData = Object.entries(dailyCostMap)
    .map(([date, modelCosts]) => ({ date, ...modelCosts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topSessionsData = stats.topSessions.map(s => ({
    name: s.name,
    cost: s.totalCost,
    primaryModel: s.primaryModel,
  }));

  const modelTableRows = Object.entries(stats.modelBreakdown)
    .filter(([, v]) => v.inputTokens > 0 || v.cost > 0)
    .sort((a, b) => b[1].cost - a[1].cost);

  return (
    <div>
      <PageHeader title="Cost Analytics" subtitle="Token usage and estimated costs" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Cost Over Time by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <CostOverTimeChart data={dailyCostData} models={models} />
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Top 10 Sessions by Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <TopSessionsChart data={topSessionsData} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Per-Model Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Model</TableHead>
                <TableHead className="text-gray-400 text-right">Requests</TableHead>
                <TableHead className="text-gray-400 text-right">Input</TableHead>
                <TableHead className="text-gray-400 text-right">Output</TableHead>
                <TableHead className="text-gray-400 text-right">Cache</TableHead>
                <TableHead className="text-gray-400 text-right">Cost</TableHead>
                <TableHead className="text-gray-400 text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelTableRows.map(([model, v]) => (
                <TableRow key={model} className="border-gray-800">
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-sm border-0"
                      style={{ backgroundColor: getModelColor(model) + '22', color: getModelColor(model) }}
                    >
                      {model}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">{v.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300 text-right">{formatTokens(v.inputTokens)}</TableCell>
                  <TableCell className="text-gray-300 text-right">{formatTokens(v.outputTokens)}</TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {formatTokens((v as { inputTokens: number; outputTokens: number; cost: number; requests: number } & { cacheReadTokens?: number }).cacheReadTokens ?? 0)}
                  </TableCell>
                  <TableCell className="text-amber-400 text-right font-medium">{formatCost(v.cost)}</TableCell>
                  <TableCell className="text-gray-400 text-right">
                    {totalCost > 0 ? ((v.cost / totalCost) * 100).toFixed(1) : '0.0'}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
