'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatCost, formatTokens } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';
import type { SessionInfo } from '@/lib/copilot-data/types';

const fetcher = (url: string) => fetch(url).then(r => r.json()) as Promise<SessionInfo[]>;

function SourceBadge({ source }: { source: 'cli' | 'vscode' }) {
  if (source === 'vscode') {
    return (
      <Badge variant="outline" className="text-xs border-blue-700 text-blue-400 bg-blue-950/40 px-1.5 py-0">
        VS Code
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 bg-gray-800/40 px-1.5 py-0">
      CLI
    </Badge>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading, error } = useSWR<SessionInfo[]>('/api/sessions?limit=200', fetcher);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'cli' | 'vscode'>('all');

  const filtered = (sessions ?? []).filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cwd.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || s.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const cliCount = (sessions ?? []).filter(s => s.source === 'cli').length;
  const vscodeCount = (sessions ?? []).filter(s => s.source === 'vscode').length;

  return (
    <div>
      <PageHeader title="Sessions" subtitle="All recorded Copilot sessions" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search sessions by name or directory..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 max-w-md"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sourceFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            All ({(sessions ?? []).length})
          </button>
          <button
            onClick={() => setSourceFilter('cli')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sourceFilter === 'cli'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            CLI ({cliCount})
          </button>
          <button
            onClick={() => setSourceFilter('vscode')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sourceFilter === 'vscode'
                ? 'bg-blue-900/60 text-blue-300'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            VS Code ({vscodeCount})
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-gray-400 text-sm py-8 text-center">Loading sessions...</div>
      )}
      {error && (
        <div className="text-red-400 text-sm py-8 text-center">Failed to load sessions.</div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Session Name</TableHead>
                <TableHead className="text-gray-400">Source</TableHead>
                <TableHead className="text-gray-400 text-right">Messages</TableHead>
                <TableHead className="text-gray-400 text-right">Tools</TableHead>
                <TableHead className="text-gray-400">Models</TableHead>
                <TableHead className="text-gray-400 text-right">Tokens</TableHead>
                <TableHead className="text-gray-400 text-right">Est. Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No sessions found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(session => (
                <TableRow
                  key={session.id}
                  className="border-gray-800 cursor-pointer hover:bg-gray-800/50"
                >
                  <TableCell className="text-gray-300 text-sm whitespace-nowrap">
                    <Link href={`/sessions/${session.id}`} className="block">
                      {formatDate(session.startTime)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <Link href={`/sessions/${session.id}`} className="block">
                      <span className="text-white font-medium truncate block">{session.name}</span>
                      <span className="text-gray-500 text-xs truncate block">{session.cwd}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={session.source} />
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">{session.userMessageCount}</TableCell>
                  <TableCell className="text-gray-300 text-right">{session.toolCallCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {session.modelsUsed.slice(0, 2).map(m => (
                        <Badge
                          key={m}
                          variant="outline"
                          className="text-xs border-0 text-white px-1.5 py-0"
                          style={{ backgroundColor: getModelColor(m) + '33', color: getModelColor(m) }}
                        >
                          {m.split('-').slice(0, 2).join('-')}
                        </Badge>
                      ))}
                      {session.modelsUsed.length > 2 && (
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                          +{session.modelsUsed.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300 text-right text-sm">
                    {session.source === 'vscode'
                      ? <span className="text-gray-600 text-xs">n/a</span>
                      : formatTokens(session.totalInputTokens + session.totalOutputTokens)
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {session.source === 'vscode'
                      ? <span className="text-gray-600 text-xs">n/a</span>
                      : <span className={session.totalCost > 0 ? 'text-amber-400 font-medium' : 'text-gray-500'}>
                          {formatCost(session.totalCost)}
                        </span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
