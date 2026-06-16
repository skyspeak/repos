import pino from "pino";

/** Plain JSON logs only — pino-pretty transport breaks in the Vercel esbuild bundle. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
