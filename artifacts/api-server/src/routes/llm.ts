import { Router } from "express";
import { getDeepDiveProvider, getLLMClient } from "../lib/llm-config";
import {
  getDeepDiveCache,
  setDeepDiveCache,
} from "../lib/deep-dive-cache";

const router = Router();

const SYSTEM_PROMPT =
  "You are an expert venture capital and technology analyst specializing in AI disruption across industries. Be specific, cite concrete examples, and provide actionable insights for investors and founders.";

router.post("/llm/deep-dive", async (req, res): Promise<void> => {
  const { prompt, cacheKey } = req.body as {
    prompt?: string;
    cacheKey?: string;
  };

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  if (cacheKey && typeof cacheKey === "string") {
    const cached = getDeepDiveCache(cacheKey);
    if (cached) {
      res.json({
        output: cached.output,
        cached: true,
        cachedAt: new Date(cached.cachedAt).toISOString(),
        refreshDay: cached.refreshDay,
      });
      return;
    }
  }

  let provider;
  try {
    provider = getDeepDiveProvider();
  } catch (err) {
    req.log.error({ err }, "Deep-dive LLM not configured");
    res.status(503).json({
      error:
        "No LLM provider configured. Set OPENROUTER_API_KEY and/or GEMINI_API_KEY.",
    });
    return;
  }

  try {
    const client = getLLMClient(provider);
    const stream = await client.chat.completions.create({
      model: provider.model,
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullOutput = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullOutput += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

    if (cacheKey && typeof cacheKey === "string" && fullOutput) {
      setDeepDiveCache(cacheKey, fullOutput);
    }
  } catch (err) {
    req.log.error({ err }, "Deep-dive stream failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "LLM stream failed" });
    } else {
      res.end();
    }
  }
});

export default router;
