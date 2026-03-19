import { Router, type IRouter } from "express";
import { db, regulationsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import {
  CreateRegulationBody,
  ListRegulationsQueryParams,
  GetRegulationParams,
  UpdateRegulationParams,
  UpdateRegulationBody,
  DeleteRegulationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const parsed = ListRegulationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { jurisdiction, status, search } = parsed.data;

  const conditions = [];
  if (jurisdiction) conditions.push(eq(regulationsTable.jurisdiction, jurisdiction as any));
  if (status) conditions.push(eq(regulationsTable.status, status as any));
  if (search) conditions.push(ilike(regulationsTable.lawName, `%${search}%`));

  const rows = await db
    .select()
    .from(regulationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(regulationsTable.createdAt);

  const result = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
  res.json(result);
});

router.get("/stats", async (_req, res) => {
  const allRows = await db.select().from(regulationsTable);

  const byJurisdiction: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const today = new Date().toISOString().split("T")[0];

  const upcomingDeadlines = allRows
    .filter((r) => r.deadlineDate && r.deadlineDate >= today)
    .sort((a, b) => (a.deadlineDate! > b.deadlineDate! ? 1 : -1))
    .slice(0, 5)
    .map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

  for (const row of allRows) {
    byJurisdiction[row.jurisdiction] = (byJurisdiction[row.jurisdiction] || 0) + 1;
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
  }

  res.json({
    totalCount: allRows.length,
    byJurisdiction: Object.entries(byJurisdiction).map(([jurisdiction, count]) => ({ jurisdiction, count })),
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    upcomingDeadlines,
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetRegulationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db.select().from(regulationsTable).where(eq(regulationsTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Regulation not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.post("/", async (req, res) => {
  const parsed = CreateRegulationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(regulationsTable)
    .values({
      ...parsed.data,
      relevantPolicies: parsed.data.relevantPolicies ?? [],
    })
    .returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() });
});

router.put("/:id", async (req, res) => {
  const paramsParsed = UpdateRegulationParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateRegulationBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [updated] = await db
    .update(regulationsTable)
    .set({ ...bodyParsed.data, updatedAt: new Date() })
    .where(eq(regulationsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Regulation not found" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteRegulationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(regulationsTable).where(eq(regulationsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
