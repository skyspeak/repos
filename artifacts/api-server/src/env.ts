import { loadEnvFile } from "node:process";
import path from "node:path";
import { existsSync } from "node:fs";

// Vercel injects env vars at runtime — no .env file needed
if (!process.env.VERCEL) {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      try {
        loadEnvFile(envPath);
        break;
      } catch {
        /* try next candidate */
      }
    }
  }
}
