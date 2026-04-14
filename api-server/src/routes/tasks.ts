import { Router, type IRouter } from "express";
import { db, tasksTable, categoriesTable } from "@workspace/db";
import { eq, and, lte, gte, lt, isNull, or, sql } from "drizzle-orm";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(str, 10);
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function getTaskWithCategory(taskId: number) {
  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      priority: tasksTable.priority,
      status: tasksTable.status,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      notes: tasksTable.notes,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(eq(tasksTable.id, taskId));
  return rows[0] ?? null;
}

router.get("/tasks/summary", async (_req, res): Promise<void> => {
  const today = toDateString(new Date());
  const nextWeek = toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable);
  const total = Number(totalRow?.count ?? 0);

  const [pendingRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.status, "pending"));
  const pending = Number(pendingRow?.count ?? 0);

  const [inProgressRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.status, "in_progress"));
  const inProgress = Number(inProgressRow?.count ?? 0);

  const [completedRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.status, "completed"));
  const completed = Number(completedRow?.count ?? 0);

  const [cancelledRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.status, "cancelled"));
  const cancelled = Number(cancelledRow?.count ?? 0);

  const [overdueRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(
    and(
      lt(tasksTable.dueDate, today),
      or(eq(tasksTable.status, "pending"), eq(tasksTable.status, "in_progress"))
    )
  );
  const overdue = Number(overdueRow?.count ?? 0);

  const [dueTodayRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(
    and(
      eq(tasksTable.dueDate, today),
      or(eq(tasksTable.status, "pending"), eq(tasksTable.status, "in_progress"))
    )
  );
  const dueToday = Number(dueTodayRow?.count ?? 0);

  const [dueSoonRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(
    and(
      gte(tasksTable.dueDate, today),
      lte(tasksTable.dueDate, nextWeek),
      or(eq(tasksTable.status, "pending"), eq(tasksTable.status, "in_progress"))
    )
  );
  const dueSoon = Number(dueSoonRow?.count ?? 0);

  const [lowRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.priority, "low"));
  const low = Number(lowRow?.count ?? 0);
  const [mediumRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.priority, "medium"));
  const medium = Number(mediumRow?.count ?? 0);
  const [highRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.priority, "high"));
  const high = Number(highRow?.count ?? 0);
  const [urgentRow] = await db.select({ count: sql<number>`count(*)` }).from(tasksTable).where(eq(tasksTable.priority, "urgent"));
  const urgent = Number(urgentRow?.count ?? 0);

  res.json({ total, pending, inProgress, completed, cancelled, overdue, dueToday, dueSoon, byPriority: { low, medium, high, urgent } });
});

router.get("/tasks/upcoming", async (_req, res): Promise<void> => {
  const today = toDateString(new Date());
  const nextWeek = toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      priority: tasksTable.priority,
      status: tasksTable.status,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      notes: tasksTable.notes,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(
      and(
        gte(tasksTable.dueDate, today),
        lte(tasksTable.dueDate, nextWeek),
        or(eq(tasksTable.status, "pending"), eq(tasksTable.status, "in_progress"))
      )
    )
    .orderBy(tasksTable.dueDate);

  res.json(rows);
});

router.get("/tasks/overdue", async (_req, res): Promise<void> => {
  const today = toDateString(new Date());

  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      priority: tasksTable.priority,
      status: tasksTable.status,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      notes: tasksTable.notes,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(
      and(
        lt(tasksTable.dueDate, today),
        or(eq(tasksTable.status, "pending"), eq(tasksTable.status, "in_progress"))
      )
    )
    .orderBy(tasksTable.dueDate);

  res.json(rows);
});

router.get("/tasks", async (req, res): Promise<void> => {
  const { category, status, priority, dueDate } = req.query;

  const conditions = [];

  if (typeof category === "string" && category) {
    const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.name, category));
    if (cat[0]) {
      conditions.push(eq(tasksTable.categoryId, cat[0].id));
    }
  }

  if (typeof status === "string" && status) {
    conditions.push(eq(tasksTable.status, status));
  }

  if (typeof priority === "string" && priority) {
    conditions.push(eq(tasksTable.priority, priority));
  }

  if (typeof dueDate === "string" && dueDate) {
    conditions.push(eq(tasksTable.dueDate, dueDate));
  }

  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      categoryId: tasksTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      priority: tasksTable.priority,
      status: tasksTable.status,
      dueDate: tasksTable.dueDate,
      dueTime: tasksTable.dueTime,
      notes: tasksTable.notes,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .leftJoin(categoriesTable, eq(tasksTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tasksTable.createdAt);

  res.json(rows);
});

router.post("/tasks", async (req, res): Promise<void> => {
  const { title, description, categoryId, priority, dueDate, dueTime, notes } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      title,
      description: description ?? null,
      categoryId: categoryId ?? null,
      priority: priority ?? "medium",
      status: "pending",
      dueDate: dueDate ?? null,
      dueTime: dueTime ?? null,
      notes: notes ?? null,
    })
    .returning();

  const full = await getTaskWithCategory(task.id);
  res.status(201).json(full);
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await getTaskWithCategory(id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(task);
});

router.put("/tasks/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const { title, description, categoryId, priority, status, dueDate, dueTime, notes } = req.body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (priority !== undefined) updates.priority = priority;
  if (status !== undefined) updates.status = status;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (dueTime !== undefined) updates.dueTime = dueTime;
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const full = await getTaskWithCategory(id);
  res.json(full);
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [deleted] = await db.delete(tasksTable).where(eq(tasksTable.id, id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ message: "Task deleted successfully" });
});

router.post("/tasks/:id/complete", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [updated] = await db.update(tasksTable).set({ status: "completed" }).where(eq(tasksTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const full = await getTaskWithCategory(id);
  res.json(full);
});

router.post("/tasks/:id/reschedule", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const { dueDate, dueTime } = req.body;

  if (!dueDate) {
    res.status(400).json({ error: "dueDate is required" });
    return;
  }

  const updates: Record<string, unknown> = { dueDate };
  if (dueTime !== undefined) updates.dueTime = dueTime;

  const [updated] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const full = await getTaskWithCategory(id);
  res.json(full);
});

export default router;
