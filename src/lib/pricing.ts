export interface ModelRate {
  input: number;
  cachedInput: number;
  cacheWrite: number;
  output: number;
}

const RATES: Record<string, ModelRate> = {
  "claude-haiku-4.5":  { input: 1.00, cachedInput: 0.10,  cacheWrite: 1.25, output: 5.00 },
  "claude-sonnet-4":   { input: 3.00, cachedInput: 0.30,  cacheWrite: 3.75, output: 15.00 },
  "claude-sonnet-4.5": { input: 3.00, cachedInput: 0.30,  cacheWrite: 3.75, output: 15.00 },
  "claude-sonnet-4.6": { input: 3.00, cachedInput: 0.30,  cacheWrite: 3.75, output: 15.00 },
  "claude-opus-4.5":   { input: 5.00, cachedInput: 0.50,  cacheWrite: 6.25, output: 25.00 },
  "claude-opus-4.6":   { input: 5.00, cachedInput: 0.50,  cacheWrite: 6.25, output: 25.00 },
  "claude-opus-4.7":   { input: 5.00, cachedInput: 0.50,  cacheWrite: 6.25, output: 25.00 },
  "gpt-4.1":           { input: 2.00, cachedInput: 0.50,  cacheWrite: 0,    output: 8.00 },
  "gpt-5-mini":        { input: 0.25, cachedInput: 0.025, cacheWrite: 0,    output: 2.00 },
  "gpt-5.2":           { input: 1.75, cachedInput: 0.175, cacheWrite: 0,    output: 14.00 },
  "gpt-5.2-codex":     { input: 1.75, cachedInput: 0.175, cacheWrite: 0,    output: 14.00 },
  "gpt-5.3-codex":     { input: 1.75, cachedInput: 0.175, cacheWrite: 0,    output: 14.00 },
  "gpt-5.4":           { input: 2.50, cachedInput: 0.25,  cacheWrite: 0,    output: 15.00 },
  "gpt-5.4-mini":      { input: 0.75, cachedInput: 0.075, cacheWrite: 0,    output: 4.50 },
  "gpt-5.4-nano":      { input: 0.20, cachedInput: 0.02,  cacheWrite: 0,    output: 1.25 },
  "gpt-5.5":           { input: 5.00, cachedInput: 0.50,  cacheWrite: 0,    output: 30.00 },
  "gemini-2.5-pro":    { input: 1.25, cachedInput: 0.125, cacheWrite: 0,    output: 10.00 },
  "gemini-3-flash":    { input: 0.50, cachedInput: 0.05,  cacheWrite: 0,    output: 3.00 },
  "gemini-3.1-pro":    { input: 2.00, cachedInput: 0.20,  cacheWrite: 0,    output: 12.00 },
  "grok-code-fast-1":  { input: 0.20, cachedInput: 0.02,  cacheWrite: 0,    output: 1.50 },
  "raptor-mini":       { input: 0.25, cachedInput: 0.025, cacheWrite: 0,    output: 2.00 },
  "goldeneye":         { input: 1.25, cachedInput: 0.125, cacheWrite: 0,    output: 10.00 },
};

export function getRate(model: string): ModelRate | null {
  if (RATES[model]) return RATES[model];
  // Prefix matching for unknown variants
  for (const key of Object.keys(RATES)) {
    if (model.startsWith(key)) return RATES[key];
  }
  return null;
}

export function calcCost(model: string, usage: {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}): number {
  const rate = getRate(model);
  if (!rate) return 0;
  return (usage.inputTokens / 1e6) * rate.input
       + (usage.outputTokens / 1e6) * rate.output
       + (usage.cacheReadTokens / 1e6) * rate.cachedInput
       + (usage.cacheWriteTokens / 1e6) * rate.cacheWrite;
}

export function getModelFamily(model: string): 'claude-opus' | 'claude-sonnet' | 'claude-haiku' | 'gpt' | 'gemini' | 'other' {
  if (model.startsWith('claude') && model.includes('opus')) return 'claude-opus';
  if (model.startsWith('claude') && model.includes('sonnet')) return 'claude-sonnet';
  if (model.startsWith('claude') && model.includes('haiku')) return 'claude-haiku';
  if (model.startsWith('gpt')) return 'gpt';
  if (model.startsWith('gemini')) return 'gemini';
  return 'other';
}

export const MODEL_COLORS: Record<string, string> = {
  'claude-opus': '#D97706',
  'claude-sonnet': '#3B82F6',
  'claude-haiku': '#10B981',
  'gpt': '#8B5CF6',
  'gemini': '#06B6D4',
  'other': '#6B7280',
};

export function getModelColor(model: string): string {
  const family = getModelFamily(model);
  return MODEL_COLORS[family] ?? '#6B7280';
}
