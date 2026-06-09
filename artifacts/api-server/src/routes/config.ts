import { Router } from "express";
import { isDatabaseConfigured } from "@workspace/db";
import {
  getAvailableProviders,
  getDeepDiveProvider,
  getInvestmentProvider,
} from "../lib/llm-config";
import { getRefreshDay } from "../lib/refresh";

const router = Router();

router.get("/config", (_req, res) => {
  const available = getAvailableProviders();
  let investmentProvider: string | null = null;
  let deepDiveProvider: string | null = null;

  try {
    investmentProvider = getInvestmentProvider().id;
  } catch {
    /* not configured */
  }
  try {
    deepDiveProvider = getDeepDiveProvider().id;
  } catch {
    /* not configured */
  }

  res.json({
    app: "disruptor",
    version: "1.0.0",
    database: {
      configured: isDatabaseConfigured(),
    },
    llm: {
      availableProviders: available,
      investmentProvider,
      deepDiveProvider,
      serverProxyEnabled: available.length > 0,
    },
    refresh: {
      cadence: "daily",
      timezone: "UTC",
      refreshDay: getRefreshDay(),
    },
  });
});

export default router;
