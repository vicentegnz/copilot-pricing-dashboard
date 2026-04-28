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

export default function SessionsPage() {
  const { data: sessions, isLoading, error } = useSWR<SessionInfo[]>('/api/sessions?limit=200', fetcher);
  const [search, setSearch] = useState('');

  const filtered = (sessions ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cwd.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Sessions" subtitle="All recorded Copilot CLI sessions" />

      <div className="mb-4">
        <Input
          placeholder="Search sessions by name or directory..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 max-w-md"
        />
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
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
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
                    {formatTokens(session.totalInputTokens + session.totalOutputTokens)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={session.totalCost > 0 ? 'text-amber-400 font-medium' : 'text-gray-500'}>
                      {formatCost(session.totalCost)}
                    </span>
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
