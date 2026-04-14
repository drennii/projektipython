import { Router, type IRouter } from "express";
import { db, categoriesTable, tasksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(str, 10);
}

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
      icon: categoriesTable.icon,
      createdAt: categoriesTable.createdAt,
      taskCount: sql<number>`count(${tasksTable.id})`,
    })
    .from(categoriesTable)
    .leftJoin(tasksTable, eq(tasksTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.name);

  res.json(rows.map(r => ({ ...r, taskCount: Number(r.taskCount) })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const { name, color, icon } = req.body;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({
      name,
      color: color ?? "#6366f1",
      icon: icon ?? null,
    })
    .returning();

  res.status(201).json({ ...category, taskCount: 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid category ID" });
    return;
  }

  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ message: "Category deleted successfully" });
});

export default router;
