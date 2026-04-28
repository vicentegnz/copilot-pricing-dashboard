export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCost(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatSessionDuration(startIso: string, endIso?: string): string {
  if (!endIso) return 'ongoing';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return formatDuration(ms);
}

/** Strip XML-like metadata tags injected into user messages */
export function stripMetadataTags(content: string): string {
  return content
    .replace(/<[a-zA-Z_][a-zA-Z0-9_]*>[\s\S]*?<\/[a-zA-Z_][a-zA-Z0-9_]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
