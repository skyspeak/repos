/**
 * Dual-provider LLM configuration.
 *
 * Set OPENROUTER_API_KEY and GEMINI_API_KEY in .env to enable both providers.
 * Investment analysis defaults to Gemini (free tier friendly).
 * Deep-dive streaming defaults to OpenRouter (higher quality models).
 */

import OpenAI from "openai";

export type LLMProviderId = "openrouter" | "gemini";

export interface ProviderConfig {
  id: LLMProviderId;
  baseURL: string;
  apiKey: string;
  model: string;
}

function openRouterConfig(): ProviderConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) return null;
  return {
    id: "openrouter",
    baseURL:
      process.env.OPENROUTER_BASE_URL ??
      process.env.LLM_BASE_URL ??
      "https://openrouter.ai/api/v1",
    apiKey,
    model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet",
  };
}

function geminiConfig(): ProviderConfig | null {
  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) return null;
  return {
    id: "gemini",
    baseURL:
      process.env.GEMINI_BASE_URL ??
      "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey,
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  };
}

const PROVIDER_FACTORIES: Record<
  LLMProviderId,
  () => ProviderConfig | null
> = {
  openrouter: openRouterConfig,
  gemini: geminiConfig,
};

export function getAvailableProviders(): LLMProviderId[] {
  return (Object.keys(PROVIDER_FACTORIES) as LLMProviderId[]).filter(
    (id) => PROVIDER_FACTORIES[id]() !== null,
  );
}

export function getProvider(id: LLMProviderId): ProviderConfig {
  const config = PROVIDER_FACTORIES[id]();
  if (!config) {
    throw new Error(
      `LLM provider "${id}" is not configured. Set ${id === "openrouter" ? "OPENROUTER_API_KEY" : "GEMINI_API_KEY"} in your environment.`,
    );
  }
  return config;
}

function resolveProvider(
  preferred: LLMProviderId,
  fallback: LLMProviderId,
): ProviderConfig {
  try {
    return getProvider(preferred);
  } catch {
    return getProvider(fallback);
  }
}

export function getInvestmentProvider(): ProviderConfig {
  const preferred = (process.env.INVESTMENT_LLM_PROVIDER ??
    "gemini") as LLMProviderId;
  const fallback: LLMProviderId =
    preferred === "gemini" ? "openrouter" : "gemini";
  return resolveProvider(preferred, fallback);
}

export function getDeepDiveProvider(): ProviderConfig {
  const preferred = (process.env.DEEP_DIVE_LLM_PROVIDER ??
    "openrouter") as LLMProviderId;
  const fallback: LLMProviderId =
    preferred === "openrouter" ? "gemini" : "openrouter";
  return resolveProvider(preferred, fallback);
}

const clientCache = new Map<LLMProviderId, OpenAI>();

export function getLLMClient(provider: ProviderConfig): OpenAI {
  const cached = clientCache.get(provider.id);
  if (cached) return cached;
  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });
  clientCache.set(provider.id, client);
  return client;
}
