import { createHash } from "crypto";
import { Router } from "express";
import { db, isDatabaseConfigured } from "@workspace/db";
import { analysesTable } from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  CreateAnalysisBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
} from "@workspace/api-zod";
import { runAnalysis } from "../analyzer/run";
import type { ChecklistItem } from "../analyzer/types";

const router = Router();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function requireDatabase(res: import("express").Response): boolean {
  if (isDatabaseConfigured()) return true;
  res.status(503).json({
    error:
      "Database not configured. Set DATABASE_URL in your deployment environment (Neon or Vercel Postgres).",
  });
  return false;
}

function documentHash(documentText: string, documentType: string): string {
  return createHash("sha256")
    .update(`${documentType}:${documentText}`)
    .digest("hex");
}

// GET /api/analyses/stats — must be before /:id
router.get("/analyses/stats", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  try {
    const all = await db.select().from(analysesTable);
    const byDocumentType = {
      earnings_transcript: 0,
      earnings_presentation: 0,
      s1_filing: 0,
    };
    const byVerdict = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    for (const a of all) {
      const dt = a.documentType as keyof typeof byDocumentType;
      if (dt in byDocumentType) byDocumentType[dt]++;
      const v = a.overallVerdict as keyof typeof byVerdict;
      if (v in byVerdict) byVerdict[v]++;
    }
    res.json({ totalAnalyses: all.length, byDocumentType, byVerdict });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/analyses
router.get("/analyses", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  try {
    const rows = await db
      .select({
        id: analysesTable.id,
        companyName: analysesTable.companyName,
        documentType: analysesTable.documentType,
        overallVerdict: analysesTable.overallVerdict,
        summary: analysesTable.summary,
        createdAt: analysesTable.createdAt,
      })
      .from(analysesTable)
      .orderBy(sql`${analysesTable.createdAt} desc`);
    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list analyses");
    res.status(500).json({ error: "Failed to list analyses" });
  }
});

// POST /api/analyses
router.post("/analyses", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  const parsed = CreateAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { documentText, documentType, companyName } = parsed.data;
  const hash = documentHash(documentText, documentType);
  const cutoff = new Date(Date.now() - ONE_DAY_MS);

  try {
    const [cached] = await db
      .select()
      .from(analysesTable)
      .where(
        and(
          eq(analysesTable.documentHash, hash),
          gte(analysesTable.createdAt, cutoff),
        ),
      )
      .limit(1);

    if (cached) {
      req.log.info({ documentType, cachedId: cached.id }, "Returning cached analysis");
      res.status(200).json({
        ...cached,
        createdAt: cached.createdAt.toISOString(),
        cached: true,
      });
      return;
    }

    req.log.info({ documentType }, "Starting analysis pipeline");
    const result = await runAnalysis(documentText, documentType, companyName);

    const [inserted] = await db
      .insert(analysesTable)
      .values({
        companyName: result.companyName,
        documentType,
        documentHash: hash,
        checklist: result.checklist,
        summary: result.summary,
        overallVerdict: result.overallVerdict,
        keyStrengths: result.keyStrengths,
        keyRisks: result.keyRisks,
      })
      .returning();

    res.status(201).json({
      ...inserted,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create analysis");
    res.status(500).json({ error: "Failed to create analysis" });
  }
});

// GET /api/analyses/:id/markdown — export as markdown for use with Cursor / Claude
router.get("/analyses/:id/markdown", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  const parsed = GetAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.id, parsed.data.id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const docTypeLabel =
      row.documentType === "earnings_transcript"
        ? "Earnings Call Transcript"
        : row.documentType === "earnings_presentation"
          ? "Earnings Presentation"
          : "S-1 Filing";

    const verdictEmoji =
      row.overallVerdict === "positive"
        ? "✅"
        : row.overallVerdict === "negative"
          ? "🔴"
          : row.overallVerdict === "mixed"
            ? "🟡"
            : "⚪";

    const checklist = row.checklist as ChecklistItem[];

    // Group by category
    const categories = Array.from(new Set(checklist.map((i) => i.category)));

    let md = `# ${row.companyName} — Investment Analysis\n\n`;
    md += `**Document Type:** ${docTypeLabel}  \n`;
    md += `**Analyzed:** ${new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  \n`;
    md += `**Overall Verdict:** ${verdictEmoji} ${row.overallVerdict.charAt(0).toUpperCase() + row.overallVerdict.slice(1)}\n\n`;
    md += `---\n\n`;

    md += `## The Bottom Line\n\n${row.summary}\n\n`;

    if (row.keyStrengths && (row.keyStrengths as string[]).length > 0) {
      md += `## Key Strengths\n\n`;
      for (const s of row.keyStrengths as string[]) {
        md += `- ${s}\n`;
      }
      md += `\n`;
    }

    if (row.keyRisks && (row.keyRisks as string[]).length > 0) {
      md += `## Key Risks\n\n`;
      for (const r of row.keyRisks as string[]) {
        md += `- ${r}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n## Detailed Checklist\n\n`;

    for (const category of categories) {
      md += `### ${category}\n\n`;
      const items = checklist.filter((i) => i.category === category);

      for (const item of items) {
        const vEmoji =
          item.verdict === "positive"
            ? "✅"
            : item.verdict === "negative"
              ? "🔴"
              : item.verdict === "mixed"
                ? "🟡"
                : "⚪";

        md += `#### ${item.metric}\n\n`;
        md += `**Verdict:** ${vEmoji} ${item.verdict.charAt(0).toUpperCase() + item.verdict.slice(1)}  \n`;
        if (item.value) md += `**Value:** ${item.value}  \n`;
        if (item.yoyChange) md += `**YoY Change:** ${item.yoyChange}  \n`;
        if (item.qoqChange) md += `**QoQ Change:** ${item.qoqChange}  \n`;
        md += `\n`;
        md += `**What it is:** ${item.whatItIs}\n\n`;
        md += `**What it means:** ${item.whatItMeans}\n\n`;
        md += `**Why this verdict:** ${item.verdictReason}\n\n`;
        if (item.flags) md += `**Note:** ${item.flags}\n\n`;
        md += `---\n\n`;
      }
    }

    const filename = `${row.companyName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-analysis.md`;
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(md);
  } catch (err) {
    req.log.error({ err }, "Failed to export markdown");
    res.status(500).json({ error: "Failed to export markdown" });
  }
});

// GET /api/analyses/:id
router.get("/analyses/:id", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  const parsed = GetAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.id, parsed.data.id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get analysis");
    res.status(500).json({ error: "Failed to get analysis" });
  }
});

// DELETE /api/analyses/:id
router.delete("/analyses/:id", async (req, res): Promise<void> => {
  if (!requireDatabase(res)) return;
  const parsed = DeleteAnalysisParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(analysesTable).where(eq(analysesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete analysis");
    res.status(500).json({ error: "Failed to delete analysis" });
  }
});

export default router;
