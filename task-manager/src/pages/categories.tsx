import { useState } from "react";
import { format } from "date-fns";
import {
  useGetCategories,
  useCreateCategory,
  useDeleteCategory,
  useGetTasks,
  getGetCategoriesQueryKey,
  getGetTasksQueryKey,
} from "@workspace/api-client-react";
import type { Task, Category } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Trash2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useCompleteTask, getGetTasksSummaryQueryKey, getGetUpcomingTasksQueryKey, getGetOverdueTasksQueryKey } from "@workspace/api-client-react";

const priorityConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  urgent: { label: "Urgent",  bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  high:   { label: "High",    bg: "bg-orange-100",  text: "text-orange-700", dot: "bg-orange-500" },
  medium: { label: "Medium",  bg: "bg-yellow-100",  text: "text-yellow-700", dot: "bg-yellow-400" },
  low:    { label: "Low",     bg: "bg-green-100",   text: "text-green-700",  dot: "bg-green-500" },
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: "Pending",     bg: "bg-slate-100",  text: "text-slate-600" },
  in_progress: { label: "In Progress", bg: "bg-blue-100",   text: "text-blue-700" },
  completed:   { label: "Completed",   bg: "bg-green-100",  text: "text-green-700" },
  cancelled:   { label: "Cancelled",   bg: "bg-red-100",    text: "text-red-700" },
};

function CategoryTaskRow({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const completeMutation = useCompleteTask();
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isOverdue = !isCompleted && !isCancelled && !!task.dueDate &&
    new Date(task.dueDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const status = statusConfig[task.status] ?? statusConfig.pending;

  const handleComplete = () => {
    if (isCompleted) return;
    completeMutation.mutate({ id: task.id }, {
      onSuccess: () => {
        toast.success("Task completed!");
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
      },
      onError: () => toast.error("Could not complete task"),
    });
  };

  return (
    <div className={`flex items-start gap-4 py-4 border-b last:border-b-0 group transition-colors hover:bg-muted/30 px-4 -mx-4 rounded-lg ${isCompleted ? "opacity-60" : ""}`}>
      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={isCompleted || isCancelled}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-green-500 transition-colors disabled:cursor-not-allowed"
        title={isCompleted ? "Already done" : "Mark complete"}
      >
        {isCompleted
          ? <CheckCircle2 className="h-6 w-6 text-green-500" />
          : <Circle className="h-6 w-6" />}
      </button>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-base leading-tight ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-sm font-medium ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
              {format(new Date(task.dueDate + "T00:00:00"), "MMM d, yyyy")}
              {isOverdue && <span className="font-bold">(Overdue)</span>}
            </span>
          )}
          {task.dueTime && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {task.dueTime}
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        <Link href={`/tasks/${task.id}/edit`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" title="Edit task">
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  isSelected,
  onClick,
  onDelete,
}: {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: number) => void;
}) {
  const pending = category.taskCount ?? 0;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden
        ${isSelected
          ? "border-primary shadow-md scale-[1.01]"
          : "border-transparent hover:border-border hover:shadow-sm"
        }
        bg-card
      `}
    >
      {/* Color bar */}
      <div className="h-2 w-full" style={{ backgroundColor: category.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{category.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pending} task{pending !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tasks in this category will become uncategorized. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl" onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full mt-1" style={{ backgroundColor: category.color }} />
            <span className="text-sm text-muted-foreground">{pending > 0 ? "Click to view tasks" : "No tasks yet"}</span>
          </div>
          {isSelected ? (
            <ChevronDown className="h-4 w-4 text-primary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryTaskPanel({ category, onClose }: { category: Category; onClose: () => void }) {
  const { data: tasks, isLoading } = useGetTasks(
    { category: category.name },
    { query: { queryKey: getGetTasksQueryKey({ category: category.name }) } }
  );

  const active = tasks?.filter(t => t.status !== "completed" && t.status !== "cancelled") ?? [];
  const done = tasks?.filter(t => t.status === "completed") ?? [];
  const cancelled = tasks?.filter(t => t.status === "cancelled") ?? [];

  return (
    <div className="col-span-full mt-2">
      <Card className="border-2 shadow-md overflow-hidden" style={{ borderColor: `${category.color}60` }}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: `${category.color}12` }}>
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: category.color }}
            >
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-foreground">{category.name} Tasks</h2>
              <p className="text-sm text-muted-foreground">
                {tasks ? `${tasks.length} total · ${active.length} active` : "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/tasks/new`}>
              <Button size="sm" className="rounded-xl gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl" title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl" />)}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <>
              {/* Active tasks */}
              {active.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Active ({active.length})
                  </h3>
                  <div className="divide-y rounded-xl border bg-card overflow-hidden px-4">
                    {active.map(task => (
                      <CategoryTaskRow key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {done.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Completed ({done.length})
                  </h3>
                  <div className="divide-y rounded-xl border bg-card overflow-hidden px-4 opacity-70">
                    {done.map(task => (
                      <CategoryTaskRow key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {cancelled.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Cancelled ({cancelled.length})
                  </h3>
                  <div className="divide-y rounded-xl border bg-card overflow-hidden px-4 opacity-50">
                    {cancelled.map(task => (
                      <CategoryTaskRow key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <FolderOpen className="h-8 w-8" style={{ color: category.color }} />
              </div>
              <h3 className="text-xl font-bold mb-2">No tasks in {category.name}</h3>
              <p className="text-muted-foreground mb-6">Add your first task to this category to get started.</p>
              <Link href="/tasks/new">
                <Button className="rounded-xl h-12 px-8 text-base gap-2">
                  <Plus className="h-5 w-5" />
                  Create a Task
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Categories() {
  const queryClient = useQueryClient();
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4f46e5");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { data: categories, isLoading } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() }
  });

  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const selectedCategory = categories?.find(c => c.id === selectedCategoryId) ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMutation.mutate({ data: { name: newCatName, color: newCatColor } }, {
      onSuccess: (created) => {
        setNewCatName("");
        toast.success("Category created!");
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        setSelectedCategoryId(created.id);
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Category deleted");
        queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        if (selectedCategoryId === id) setSelectedCategoryId(null);
      },
    });
  };

  const handleCategoryClick = (id: number) => {
    setSelectedCategoryId(prev => (prev === id ? null : id));
  };

  const presetColors = [
    // Reds & Pinks
    "#ef4444", "#f43f5e", "#fb7185", "#fda4af",
    // Oranges
    "#f97316", "#fb923c", "#fdba74",
    // Yellows & Ambers
    "#f59e0b", "#eab308", "#fde047",
    // Greens
    "#84cc16", "#22c55e", "#10b981", "#34d399",
    // Teals & Cyans
    "#14b8a6", "#06b6d4", "#22d3ee",
    // Blues
    "#0ea5e9", "#3b82f6", "#60a5fa",
    // Indigos & Purples
    "#6366f1", "#818cf8", "#8b5cf6", "#a78bfa",
    // Violets & Fuchsias
    "#a855f7", "#c084fc", "#d946ef", "#e879f9",
    // Hot Pinks
    "#ec4899", "#f472b6",
    // Neutrals
    "#64748b", "#94a3b8", "#6b7280", "#78716c",
    // Dark tones
    "#1e293b", "#1e3a5f", "#14532d", "#4a1942",
  ];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 mb-2">
          <Tag className="h-8 w-8 text-primary" />
          Categories
        </h1>
        <p className="text-muted-foreground text-lg">
          Click any category to see all its tasks with dates and progress.
        </p>
      </div>

      {/* Create form */}
      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Add New Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cat-name" className="text-base">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Work, Home, Health..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-12 rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Colour</Label>
              <div className="flex items-center gap-2">
                <div
                  className="h-12 w-12 rounded-xl overflow-hidden border-2 shadow-sm relative flex-shrink-0"
                  style={{ borderColor: newCatColor }}
                >
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-xs">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${newCatColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-110"}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Use colour ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 px-8 rounded-xl"
              disabled={createMutation.isPending || !newCatName.trim()}
            >
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category grid + expanded task panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 group">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-36 bg-muted rounded-2xl animate-pulse" />)
        ) : categories && categories.length > 0 ? (
          <>
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onClick={() => handleCategoryClick(category.id)}
                onDelete={handleDelete}
              />
            ))}

            {/* Expanded task panel - spans full width below cards */}
            {selectedCategory && (
              <CategoryTaskPanel
                key={selectedCategory.id}
                category={selectedCategory}
                onClose={() => setSelectedCategoryId(null)}
              />
            )}
          </>
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Tag className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-semibold">No categories yet</p>
            <p className="text-base mt-1">Create one above to start organising your tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
