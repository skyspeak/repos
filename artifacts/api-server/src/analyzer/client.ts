/**
 * Investment analysis LLM client.
 * Uses Gemini by default (free tier); falls back to OpenRouter.
 */

import type OpenAI from "openai";
import {
  getInvestmentProvider,
  getLLMClient,
  type ProviderConfig,
} from "../lib/llm-config";

let cachedProvider: ProviderConfig | null = null;
let cachedClient: OpenAI | null = null;

function ensureClient(): { client: OpenAI; model: string } {
  if (!cachedClient || !cachedProvider) {
    cachedProvider = getInvestmentProvider();
    cachedClient = getLLMClient(cachedProvider);
  }
  return { client: cachedClient, model: cachedProvider.model };
}

export const llm = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const { client } = ensureClient();
    const value = client[prop as keyof OpenAI];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function getLLMModel(): string {
  return ensureClient().model;
}
