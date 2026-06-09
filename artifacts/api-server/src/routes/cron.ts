import { Router } from "express";
import { clearDeepDiveCache } from "../lib/deep-dive-cache";
import { getRefreshDay } from "../lib/refresh";

const router = Router();

function isAuthorizedCron(req: import("express").Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

router.get("/cron/daily-refresh", (req, res): void => {
  if (!isAuthorizedCron(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clearedEntries = clearDeepDiveCache();
  const refreshDay = getRefreshDay();

  req.log.info({ refreshDay, clearedEntries }, "Daily refresh completed");

  res.json({
    ok: true,
    refreshDay,
    clearedDeepDiveEntries: clearedEntries,
    message:
      "Server caches cleared. LLM outputs and analyses refresh on the next request after UTC midnight.",
  });
});

export default router;
