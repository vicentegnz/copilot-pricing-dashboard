import fs from 'fs';
import path from 'path';
import os from 'os';
import { parse as parseYaml } from 'yaml';
import { calcCost } from '@/lib/pricing';
import { stripMetadataTags } from '@/lib/format';
import type {
  SessionInfo,
  SessionDetail,
  DashboardStats,
  ModelUsage,
  MessageEvent,
} from './types';

export function getSessionsDir(): string {
  return process.env.COPILOT_SESSION_DIR
    ?? path.join(os.homedir(), '.copilot', 'session-state');
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

interface RawShutdownMetrics {
  count?: number;
  cost?: number;
}

interface RawModelMetrics {
  requests?: RawShutdownMetrics;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    reasoningTokens?: number;
  };
}

interface RawShutdownData {
  totalPremiumRequests?: number;
  totalApiDurationMs?: number;
  sessionStartTime?: number;
  modelMetrics?: Record<string, RawModelMetrics>;
  currentModel?: string;
  currentTokens?: number;
  shutdownType?: string;
}

interface RawSessionStartData {
  sessionId?: string;
  startTime?: string;
  cwd?: string;
  copilotVersion?: string;
}

interface RawEvent {
  type: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

export function parseSession(dir: string): SessionInfo | null {
  const eventsPath = path.join(dir, 'events.jsonl');
  const workspacePath = path.join(dir, 'workspace.yaml');

  if (!fs.existsSync(eventsPath)) return null;

  const sessionId = path.basename(dir);

  // Read workspace.yaml
  let workspaceName: string | null = null;
  if (fs.existsSync(workspacePath)) {
    try {
      const yaml = parseYaml(fs.readFileSync(workspacePath, 'utf-8')) as Record<string, unknown>;
      const summary = yaml.summary as string | undefined;
      if (summary && !isUuid(summary) && summary.trim()) {
        workspaceName = summary.trim();
      }
    } catch {
      // ignore
    }
  }

  let startTime = '';
  let cwd = '';
  let copilotVersion = '';
  let userMessageCount = 0;
  let toolCallCount = 0;
  let lastShutdown: RawShutdownData | null = null;
  let lastShutdownTimestamp: string | undefined;

  const lines = fs.readFileSync(eventsPath, 'utf-8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event: RawEvent;
    try {
      event = JSON.parse(trimmed) as RawEvent;
    } catch {
      continue;
    }

    const data = event.data as Record<string, unknown> | undefined;

    if (event.type === 'session.start' && data) {
      const d = data as unknown as RawSessionStartData;
      if (!startTime && d.startTime) startTime = d.startTime;
      if (!cwd && d.cwd) cwd = d.cwd as string;
      if (!copilotVersion && d.copilotVersion) copilotVersion = d.copilotVersion as string;
    } else if (event.type === 'session.shutdown' && data) {
      lastShutdown = data as unknown as RawShutdownData;
      lastShutdownTimestamp = event.timestamp;
    } else if (event.type === 'user.message') {
      userMessageCount++;
    } else if (event.type === 'tool.execution_start') {
      toolCallCount++;
    }
  }

  // Build model metrics from shutdown event
  const modelMetrics: Record<string, ModelUsage> = {};

  if (lastShutdown?.modelMetrics) {
    for (const [model, raw] of Object.entries(lastShutdown.modelMetrics)) {
      const usage = raw.usage ?? {};
      const mu: ModelUsage = {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        cacheReadTokens: usage.cacheReadTokens ?? 0,
        cacheWriteTokens: usage.cacheWriteTokens ?? 0,
        reasoningTokens: usage.reasoningTokens ?? 0,
        requests: raw.requests?.count ?? 0,
        cost: 0,
      };
      mu.cost = calcCost(model, mu);
      modelMetrics[model] = mu;
    }
  }

  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheWriteTokens = 0;

  for (const mu of Object.values(modelMetrics)) {
    totalCost += mu.cost;
    totalInputTokens += mu.inputTokens;
    totalOutputTokens += mu.outputTokens;
    totalCacheReadTokens += mu.cacheReadTokens;
    totalCacheWriteTokens += mu.cacheWriteTokens;
  }

  const modelsUsed = Object.keys(modelMetrics);
  const primaryModel = modelsUsed.reduce((best, m) =>
    (modelMetrics[m].inputTokens > (modelMetrics[best]?.inputTokens ?? -1)) ? m : best,
    modelsUsed[0] ?? ''
  );

  return {
    id: sessionId,
    source: 'cli' as const,
    name: workspaceName ?? sessionId,
    startTime: startTime || new Date(0).toISOString(),
    endTime: lastShutdownTimestamp,
    cwd,
    copilotVersion,
    userMessageCount,
    toolCallCount,
    modelMetrics,
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheWriteTokens,
    modelsUsed,
    primaryModel,
  };
}

export function getVSCodeWorkspaceStorageDir(): string {
  if (process.env.VSCODE_WORKSPACE_STORAGE_DIR) {
    return process.env.VSCODE_WORKSPACE_STORAGE_DIR;
  }
  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(home, 'AppData', 'Roaming', 'Code', 'User', 'workspaceStorage');
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage');
  }
  // Linux
  return path.join(home, '.config', 'Code', 'User', 'workspaceStorage');
}

function decodeWorkspaceFolderUri(folderUri: string): string {
  try {
    // file:///c%3A/Develop/pezaio/checkout => c:/Develop/pezaio/checkout
    return decodeURIComponent(folderUri.replace(/^file:\/\/\//, ''));
  } catch {
    return folderUri;
  }
}

export function parseVSCodeSession(transcriptFile: string, workspaceFolder: string): SessionInfo | null {
  if (!fs.existsSync(transcriptFile)) return null;

  const sessionId = path.basename(transcriptFile, '.jsonl');
  const workspaceName = workspaceFolder ? path.basename(workspaceFolder) : sessionId;

  let startTime = '';
  let copilotVersion = '';
  let userMessageCount = 0;
  let toolCallCount = 0;

  const lines = fs.readFileSync(transcriptFile, 'utf-8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event: RawEvent;
    try {
      event = JSON.parse(trimmed) as RawEvent;
    } catch {
      continue;
    }

    const data = event.data as Record<string, unknown> | undefined;

    if (event.type === 'session.start' && data) {
      if (!startTime && data.startTime) startTime = data.startTime as string;
      if (!copilotVersion && data.copilotVersion) copilotVersion = data.copilotVersion as string;
    } else if (event.type === 'user.message') {
      userMessageCount++;
    } else if (event.type === 'tool.execution_start') {
      toolCallCount++;
    }
  }

  if (!startTime) return null;

  return {
    id: sessionId,
    source: 'vscode' as const,
    name: workspaceName,
    startTime,
    endTime: undefined,
    cwd: workspaceFolder,
    copilotVersion,
    userMessageCount,
    toolCallCount,
    modelMetrics: {},
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheWriteTokens: 0,
    modelsUsed: [],
    primaryModel: '',
  };
}

export async function getVSCodeSessions(): Promise<SessionInfo[]> {
  const storageDir = getVSCodeWorkspaceStorageDir();
  if (!fs.existsSync(storageDir)) return [];

  const sessions: SessionInfo[] = [];
  const workspaceDirs = fs.readdirSync(storageDir, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const workspaceDir of workspaceDirs) {
    const copilotChatDir = path.join(storageDir, workspaceDir.name, 'GitHub.copilot-chat');
    const transcriptsDir = path.join(copilotChatDir, 'transcripts');
    const workspaceJsonPath = path.join(storageDir, workspaceDir.name, 'workspace.json');

    if (!fs.existsSync(transcriptsDir)) continue;

    let workspaceFolder = '';
    if (fs.existsSync(workspaceJsonPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8')) as Record<string, unknown>;
        if (json.folder) workspaceFolder = decodeWorkspaceFolderUri(json.folder as string);
      } catch {
        // ignore
      }
    }

    const transcriptFiles = fs.readdirSync(transcriptsDir)
      .filter(f => f.endsWith('.jsonl'));

    for (const file of transcriptFiles) {
      try {
        const session = parseVSCodeSession(path.join(transcriptsDir, file), workspaceFolder);
        if (session) sessions.push(session);
      } catch {
        // skip malformed sessions
      }
    }
  }

  return sessions;
}

export async function getAllSessions(): Promise<SessionInfo[]> {
  const sessionsDir = getSessionsDir();
  const cliSessions: SessionInfo[] = [];

  if (fs.existsSync(sessionsDir)) {
    const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(sessionsDir, entry.name);
      try {
        const session = parseSession(dir);
        if (session) cliSessions.push(session);
      } catch {
        // skip malformed sessions
      }
    }
  }

  const vscodeSessions = await getVSCodeSessions();

  const all = [...cliSessions, ...vscodeSessions];
  return all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

function parseMessagesFromJsonl(filePath: string, isCli: boolean): { messages: MessageEvent[]; modelTimeline: { timestamp: string; model: string }[] } {
  const messages: MessageEvent[] = [];
  const modelTimeline: { timestamp: string; model: string }[] = [];

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event: RawEvent;
    try {
      event = JSON.parse(trimmed) as RawEvent;
    } catch {
      continue;
    }

    const ts = event.timestamp ?? new Date().toISOString();
    const data = event.data as Record<string, unknown> | undefined;

    if (event.type === 'user.message' && data) {
      const raw = (data.content as string) ?? '';
      messages.push({
        type: 'user',
        timestamp: ts,
        content: isCli ? stripMetadataTags(raw) : raw,
      });
    } else if (event.type === 'assistant.message' && data) {
      const toolRequests = (data.toolRequests as Array<{ name: string; arguments?: Record<string, unknown> }>) ?? [];
      const contentParts: string[] = [];
      if (data.content) contentParts.push(data.content as string);
      if (toolRequests.length > 0) {
        contentParts.push(toolRequests.map(t => `[tool: ${t.name}]`).join(' '));
      }
      messages.push({
        type: 'assistant',
        timestamp: ts,
        content: contentParts.join('\n') || undefined,
      });
    } else if (event.type === 'tool.execution_start' && data) {
      messages.push({
        type: 'tool_start',
        timestamp: ts,
        toolName: (data.toolName as string) ?? '',
        toolArgs: (data.arguments as Record<string, unknown>) ?? {},
      });
    } else if (event.type === 'tool.execution_complete' && data) {
      messages.push({
        type: 'tool_complete',
        timestamp: ts,
        toolName: (data.toolName as string) ?? '',
        durationMs: (data.durationMs as number) ?? 0,
      });
    } else if (isCli && event.type === 'session.model_change' && data) {
      modelTimeline.push({
        timestamp: ts,
        model: (data.newModel as string) ?? '',
      });
    }
  }

  return { messages, modelTimeline };
}

function findVSCodeTranscriptFile(id: string): { transcriptFile: string; workspaceFolder: string } | null {
  const storageDir = getVSCodeWorkspaceStorageDir();
  if (!fs.existsSync(storageDir)) return null;

  const workspaceDirs = fs.readdirSync(storageDir, { withFileTypes: true })
    .filter(e => e.isDirectory());

  for (const workspaceDir of workspaceDirs) {
    const transcriptsDir = path.join(storageDir, workspaceDir.name, 'GitHub.copilot-chat', 'transcripts');
    const transcriptFile = path.join(transcriptsDir, `${id}.jsonl`);
    if (fs.existsSync(transcriptFile)) {
      const workspaceJsonPath = path.join(storageDir, workspaceDir.name, 'workspace.json');
      let workspaceFolder = '';
      if (fs.existsSync(workspaceJsonPath)) {
        try {
          const json = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8')) as Record<string, unknown>;
          if (json.folder) workspaceFolder = decodeWorkspaceFolderUri(json.folder as string);
        } catch {
          // ignore
        }
      }
      return { transcriptFile, workspaceFolder };
    }
  }
  return null;
}

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  // Try CLI session first
  const sessionsDir = getSessionsDir();
  const dir = path.join(sessionsDir, id);
  const eventsPath = path.join(dir, 'events.jsonl');

  if (fs.existsSync(eventsPath)) {
    const base = parseSession(dir);
    if (!base) return null;
    const { messages, modelTimeline } = parseMessagesFromJsonl(eventsPath, true);
    return { ...base, messages, modelTimeline };
  }

  // Fall back to VS Code session
  const vscodeMatch = findVSCodeTranscriptFile(id);
  if (!vscodeMatch) return null;

  const base = parseVSCodeSession(vscodeMatch.transcriptFile, vscodeMatch.workspaceFolder);
  if (!base) return null;

  const { messages, modelTimeline } = parseMessagesFromJsonl(vscodeMatch.transcriptFile, false);
  return { ...base, messages, modelTimeline };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const sessions = await getAllSessions();

  let totalUserMessages = 0;
  let totalToolCalls = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCost = 0;

  const modelBreakdown: Record<string, { cost: number; inputTokens: number; outputTokens: number; requests: number }> = {};
  const dailyMap: Record<string, { sessions: number; cost: number; tokens: number }> = {};

  for (const s of sessions) {
    totalUserMessages += s.userMessageCount;
    totalToolCalls += s.toolCallCount;
    totalInputTokens += s.totalInputTokens;
    totalOutputTokens += s.totalOutputTokens;
    totalCacheReadTokens += s.totalCacheReadTokens;
    totalCost += s.totalCost;

    for (const [model, mu] of Object.entries(s.modelMetrics)) {
      if (!modelBreakdown[model]) {
        modelBreakdown[model] = { cost: 0, inputTokens: 0, outputTokens: 0, requests: 0 };
      }
      modelBreakdown[model].cost += mu.cost;
      modelBreakdown[model].inputTokens += mu.inputTokens;
      modelBreakdown[model].outputTokens += mu.outputTokens;
      modelBreakdown[model].requests += mu.requests;
    }

    const date = s.startTime.slice(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { sessions: 0, cost: 0, tokens: 0 };
    dailyMap[date].sessions++;
    dailyMap[date].cost += s.totalCost;
    dailyMap[date].tokens += s.totalInputTokens + s.totalOutputTokens;
  }

  const dailyActivity = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topSessions = [...sessions]
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10);

  return {
    totalSessions: sessions.length,
    totalUserMessages,
    totalToolCalls,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCost,
    modelBreakdown,
    dailyActivity,
    topSessions,
  };
}
