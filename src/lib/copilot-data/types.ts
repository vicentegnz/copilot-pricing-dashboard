export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  requests: number;
  cost: number;
}

export interface SessionInfo {
  id: string;
  source: 'cli' | 'vscode';
  name: string;
  startTime: string;
  endTime?: string;
  cwd: string;
  copilotVersion: string;
  userMessageCount: number;
  toolCallCount: number;
  modelMetrics: Record<string, ModelUsage>;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  modelsUsed: string[];
  primaryModel: string;
}

export interface MessageEvent {
  type: 'user' | 'assistant' | 'tool_start' | 'tool_complete';
  timestamp: string;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  durationMs?: number;
}

export interface SessionDetail extends SessionInfo {
  messages: MessageEvent[];
  modelTimeline: { timestamp: string; model: string }[];
}

export interface DashboardStats {
  totalSessions: number;
  totalUserMessages: number;
  totalToolCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCost: number;
  modelBreakdown: Record<string, { cost: number; inputTokens: number; outputTokens: number; requests: number }>;
  dailyActivity: { date: string; sessions: number; cost: number; tokens: number }[];
  topSessions: SessionInfo[];
}
