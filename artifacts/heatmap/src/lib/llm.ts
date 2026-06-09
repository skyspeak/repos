import { getRefreshDay, isCacheValidForToday } from './refresh';

export interface LLMSettings {
  provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'mistral' | 'nvidia' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AppConfig {
  llm: {
    availableProviders: string[];
    investmentProvider: string | null;
    deepDiveProvider: string | null;
    serverProxyEnabled: boolean;
  };
  refresh: {
    cadence: 'daily';
    timezone: 'UTC';
    refreshDay: string;
  };
}

export const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string; label: string; keyOptional?: boolean }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    label: 'OpenAI',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-opus-4-5',
    label: 'Anthropic',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-3.5-sonnet',
    label: 'OpenRouter',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    label: 'Google Gemini',
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    label: 'Mistral',
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/llama-3.1-nemotron-70b-instruct',
    label: 'NVIDIA Nemotron',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.1',
    label: 'Ollama (local)',
    keyOptional: true,
  },
  custom: {
    baseUrl: '',
    model: '',
    label: 'Custom / Local',
    keyOptional: true,
  },
};

export const DEFAULT_SETTINGS: LLMSettings = {
  provider: 'openrouter',
  apiKey: '',
  baseUrl: PROVIDER_PRESETS.openrouter.baseUrl,
  model: PROVIDER_PRESETS.openrouter.model,
};

const SETTINGS_KEY = 'heatmap-llm-settings';
const CONFIG_KEY = 'disruptor-app-config';
const DEEP_DIVE_CACHE_PREFIX = 'deep-dive-cache-';

export function loadLLMSettings(): LLMSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveLLMSettings(s: LLMSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadAppConfig(): AppConfig | null {
  try {
    const raw = sessionStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveAppConfig(config: AppConfig) {
  sessionStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const resp = await fetch('/api/config');
    if (!resp.ok) return null;
    const config = (await resp.json()) as AppConfig;
    saveAppConfig(config);
    return config;
  } catch {
    return null;
  }
}

interface DeepDiveCacheEntry {
  output: string;
  cachedAt: number;
  refreshDay?: string;
}

export function loadDeepDiveCache(cacheKey: string): DeepDiveCacheEntry | null {
  try {
    const raw = localStorage.getItem(`${DEEP_DIVE_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as DeepDiveCacheEntry;
    if (!isCacheValidForToday(entry.cachedAt, entry.refreshDay)) {
      localStorage.removeItem(`${DEEP_DIVE_CACHE_PREFIX}${cacheKey}`);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function saveDeepDiveCache(cacheKey: string, output: string) {
  const entry: DeepDiveCacheEntry = {
    output,
    cachedAt: Date.now(),
    refreshDay: getRefreshDay(),
  };
  localStorage.setItem(`${DEEP_DIVE_CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry));
}

export function canRefreshDeepDive(cacheKey: string): boolean {
  return loadDeepDiveCache(cacheKey) === null;
}

async function streamViaServerProxy(
  prompt: string,
  cacheKey: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
  signal?: AbortSignal,
) {
  const cached = loadDeepDiveCache(cacheKey);
  if (cached) {
    onChunk(cached.output);
    onDone();
    return;
  }

  const resp = await fetch('/api/llm/deep-dive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ prompt, cacheKey }),
  });

  if (!resp.ok) {
    const contentType = resp.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const err = await resp.json();
      onError(err.error ?? `API error ${resp.status}`);
    } else {
      onError(`API error ${resp.status}`);
    }
    return;
  }

  const contentType = resp.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = await resp.json();
    if (data.output) {
      saveDeepDiveCache(cacheKey, data.output);
      onChunk(data.output);
    }
    onDone();
    return;
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    onError('No response body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let accum = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.text ?? '';
        if (text) {
          accum += text;
          onChunk(text);
        }
      } catch {}
    }
  }

  if (accum) saveDeepDiveCache(cacheKey, accum);
  onDone();
}

async function streamViaBrowser(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
  signal?: AbortSignal,
) {
  const settings = loadLLMSettings();
  const preset = PROVIDER_PRESETS[settings.provider];
  const keyOptional = preset?.keyOptional;

  if (!settings.apiKey && !keyOptional) {
    onError('No API key set. Configure OPENROUTER_API_KEY / GEMINI_API_KEY in .env (server proxy) or add a key in AI Settings.');
    return;
  }

  const isAnthropicNative = settings.provider === 'anthropic';
  const systemPrompt =
    'You are an expert venture capital and technology analyst specializing in AI disruption across industries. Be specific, cite concrete examples, and provide actionable insights for investors and founders.';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isAnthropicNative) {
    if (settings.apiKey) headers['x-api-key'] = settings.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const url = isAnthropicNative
    ? `${settings.baseUrl}/messages`
    : `${settings.baseUrl}/chat/completions`;

  const body = isAnthropicNative
    ? {
        model: settings.model,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }
    : {
        model: settings.model,
        max_tokens: 2048,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    onError(`API error ${resp.status}: ${err}`);
    return;
  }

  const reader = resp.body?.getReader();
  if (!reader) { onError('No response body'); return; }
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (isAnthropicNative) {
          if (parsed?.type === 'content_block_delta') {
            const text = parsed?.delta?.text || '';
            if (text) onChunk(text);
          }
        } else {
          const text = parsed?.choices?.[0]?.delta?.content || '';
          if (text) onChunk(text);
        }
      } catch {}
    }
  }
  onDone();
}

export async function streamLLM(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
  signal?: AbortSignal,
  cacheKey?: string,
) {
  const config = loadAppConfig();
  const useServerProxy = config?.llm.serverProxyEnabled ?? false;

  try {
    if (useServerProxy && cacheKey) {
      await streamViaServerProxy(prompt, cacheKey, onChunk, onDone, onError, signal);
      return;
    }
    await streamViaBrowser(prompt, onChunk, onDone, onError, signal);
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string } | undefined;
    if (err?.name === 'AbortError') {
      onDone();
      return;
    }
    onError(err?.message ?? 'Unknown error');
  }
}
