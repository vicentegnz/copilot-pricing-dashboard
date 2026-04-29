'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCost, formatTokens, formatDateTime, formatDuration, formatSessionDuration } from '@/lib/format';
import { getModelColor } from '@/lib/pricing';
import { ArrowLeft, User, Bot, Wrench } from 'lucide-react';
import type { SessionDetail, MessageEvent } from '@/lib/copilot-data/types';

const fetcher = (url: string) => fetch(url).then(r => r.json()) as Promise<SessionDetail>;

function MessageBubble({ msg }: { msg: MessageEvent }) {
  if (msg.type === 'user') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">{formatDateTime(msg.timestamp)}</div>
          <div className="bg-blue-900/40 border border-blue-800/50 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap">
            {msg.content || <span className="text-gray-500 italic">empty</span>}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'assistant') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-gray-300" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">{formatDateTime(msg.timestamp)}</div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
            {msg.content || <span className="text-gray-500 italic">processing…</span>}
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'tool_start') {
    return (
      <div className="flex gap-3 mb-2 ml-10">
        <div className="w-6 h-6 rounded-md bg-purple-900/50 flex items-center justify-center shrink-0">
          <Wrench className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-purple-800 text-purple-300 bg-purple-900/20">
            {msg.toolName}
          </Badge>
          {msg.toolArgs && Object.keys(msg.toolArgs).length > 0 && (
            <span className="text-xs text-gray-500 truncate max-w-xs">
              {JSON.stringify(msg.toolArgs).slice(0, 80)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === 'tool_complete') {
    return (
      <div className="flex gap-3 mb-3 ml-10">
        <div className="w-6 h-6 rounded-md bg-green-900/30 flex items-center justify-center shrink-0">
          <Wrench className="w-3.5 h-3.5 text-green-400" />
        </div>
        <span className="text-xs text-gray-500">
          {msg.toolName} — {msg.durationMs != null ? formatDuration(msg.durationMs) : ''}
        </span>
      </div>
    );
  }

  return null;
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useSWR<SessionDetail>(
    params?.id ? `/api/sessions/${params.id}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div>
        <Link href="/sessions" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </Link>
        <div className="text-gray-400 py-12 text-center">Loading session…</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div>
        <Link href="/sessions" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </Link>
        <div className="text-red-400 py-12 text-center">Session not found.</div>
      </div>
    );
  }

  const modelEntries = Object.entries(session.modelMetrics);

  return (
    <div>
      <Link href="/sessions" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Sessions
      </Link>
      <PageHeader
        title={session.name}
        subtitle={`${formatDateTime(session.startTime)} · ${formatSessionDuration(session.startTime, session.endTime)}`}
      />
      <div className="mb-4">
        {session.source === 'vscode' ? (
          <Badge variant="outline" className="text-xs border-blue-700 text-blue-400 bg-blue-950/40 px-2 py-0.5">
            VS Code
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 bg-gray-800/40 px-2 py-0.5">
            CLI
          </Badge>
        )}
      </div>

      <div className="flex gap-4">
        {/* Left: message timeline */}
        <div className="flex-1 min-w-0" style={{ flex: '0 0 70%' }}>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              {session.messages.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">No messages recorded.</div>
              ) : (
                session.messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: metadata panel */}
        <div className="space-y-4" style={{ flex: '0 0 30%', minWidth: 0 }}>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-300">{formatDateTime(session.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="text-gray-300">{formatSessionDuration(session.startTime, session.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="text-gray-300">{session.copilotVersion || 'n/a'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Messages</span>
                <span className="text-gray-300">{session.userMessageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tool calls</span>
                <span className="text-gray-300">{session.toolCallCount}</span>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 block mb-1">Directory</span>
                <span className="text-gray-300 text-xs break-all">{session.cwd}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Token Usage by Model</CardTitle>
            </CardHeader>
            <CardContent>
              {modelEntries.length === 0 ? (
                <p className="text-gray-500 text-sm">No token data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-500 text-xs px-2">Model</TableHead>
                      <TableHead className="text-gray-500 text-xs px-2 text-right">In</TableHead>
                      <TableHead className="text-gray-500 text-xs px-2 text-right">Out</TableHead>
                      <TableHead className="text-gray-500 text-xs px-2 text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelEntries.map(([model, mu]) => (
                      <TableRow key={model} className="border-gray-800">
                        <TableCell className="px-2 py-1.5">
                          <Badge
                            variant="outline"
                            className="text-xs border-0 px-1"
                            style={{ backgroundColor: getModelColor(model) + '33', color: getModelColor(model) }}
                          >
                            {model.split('-').slice(0, 3).join('-')}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-right text-xs text-gray-300">
                          {formatTokens(mu.inputTokens)}
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-right text-xs text-gray-300">
                          {formatTokens(mu.outputTokens)}
                        </TableCell>
                        <TableCell className="px-2 py-1.5 text-right text-xs text-amber-400">
                          {formatCost(mu.cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-amber-400 font-medium">{formatCost(session.totalCost)}</span>
              </div>
            </CardContent>
          </Card>

          {session.modelTimeline.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Model Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {session.modelTimeline.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getModelColor(entry.model) }}
                    />
                    <span className="text-gray-300 truncate flex-1">{entry.model}</span>
                    <span className="text-gray-500 text-xs shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
