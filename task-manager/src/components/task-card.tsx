import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Edit2, Trash2, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  useCompleteTask,
  useDeleteTask,
  getGetTasksQueryKey,
  getGetUpcomingTasksQueryKey,
  getGetOverdueTasksQueryKey,
  getGetTasksSummaryQueryKey,
  useRescheduleTask,
} from "@workspace/api-client-react";
import type { Task } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface TaskCardProps {
  task: Task;
  onStatusChange?: () => void;
  compact?: boolean;
}

const priorityConfig: Record<string, { border: string; bg: string; label: string; text: string }> = {
  urgent: { border: "border-l-red-500", bg: "bg-red-50", label: "URGENT", text: "text-red-600" },
  high:   { border: "border-l-orange-500", bg: "bg-orange-50", label: "HIGH", text: "text-orange-600" },
  medium: { border: "border-l-yellow-400", bg: "bg-yellow-50", label: "MEDIUM", text: "text-yellow-600" },
  low:    { border: "border-l-green-500", bg: "bg-green-50", label: "LOW", text: "text-green-600" },
};

const statusConfig: Record<string, { label: string; badge: string }> = {
  pending:     { label: "Pending",     badge: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", badge: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completed",   badge: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelled",   badge: "bg-red-100 text-red-700" },
};

export function TaskCard({ task, onStatusChange, compact = false }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const completeMutation = useCompleteTask();
  const deleteMutation = useDeleteTask();
  const rescheduleMutation = useRescheduleTask();

  const isCompleted = task.status === "completed";
  const isOverdue =
    !isCompleted &&
    !!task.dueDate &&
    new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const status = statusConfig[task.status] ?? statusConfig.pending;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
  };

  const handleComplete = () => {
    if (isCompleted) return;
    setIsCompleting(true);
    completeMutation.mutate({ id: task.id }, {
      onSuccess: () => {
        toast.success("Task completed!", { icon: "🎉" });
        invalidate();
        if (onStatusChange) onStatusChange();
        setTimeout(() => setIsCompleting(false), 800);
      },
      onError: () => {
        toast.error("Could not complete task");
        setIsCompleting(false);
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: task.id }, {
      onSuccess: () => {
        toast.success("Task deleted");
        invalidate();
      },
      onError: () => toast.error("Could not delete task"),
    });
  };

  const handleReschedule = (date: Date | undefined) => {
    if (!date) return;
    setRescheduleOpen(false);
    rescheduleMutation.mutate(
      { id: task.id, data: { dueDate: format(date, "yyyy-MM-dd") } },
      {
        onSuccess: () => {
          toast.success(`Rescheduled to ${format(date, "MMM do")}`);
          invalidate();
        },
        onError: () => toast.error("Could not reschedule task"),
      }
    );
  };

  return (
    <Card
      className={`relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-md
        ${priority.border}
        ${isCompleted ? "opacity-60 grayscale-[0.4]" : ""}
        ${isCompleting ? "scale-[0.98] opacity-50" : "scale-100"}
        ${compact ? "rounded-xl" : ""}
      `}
    >
      <div className={`flex flex-col md:flex-row gap-3 items-start ${compact ? "p-3" : "p-4 md:p-5"}`}>

        {/* Complete toggle */}
        <button
          onClick={handleComplete}
          disabled={isCompleted || isCompleting}
          className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-green-500 transition-colors focus:outline-none disabled:cursor-not-allowed"
          aria-label={isCompleted ? "Already completed" : "Mark as complete"}
          data-testid="button-complete-task"
        >
          {isCompleted || isCompleting ? (
            <CheckCircle2 className={`${compact ? "h-6 w-6" : "h-8 w-8"} text-green-500 ${isCompleting ? "animate-pulse" : ""}`} />
          ) : (
            <Circle className={`${compact ? "h-6 w-6" : "h-8 w-8"}`} />
          )}
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {task.categoryName && (
              <span
                className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                style={{
                  backgroundColor: task.categoryColor ? `${task.categoryColor}22` : "#e2e8f0",
                  color: task.categoryColor ?? "#475569",
                }}
              >
                {task.categoryName}
              </span>
            )}
            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${priority.text} bg-white/60`}>
              {priority.label}
            </span>
            <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${status.badge}`}>
              {status.label}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-foreground leading-snug ${compact ? "text-base" : "text-lg md:text-xl"} ${isCompleted ? "line-through text-muted-foreground" : ""}`}
          >
            {task.title}
          </h3>

          {/* Description */}
          {!compact && task.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm font-medium">
            {task.dueDate && (
              <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                {isOverdue ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                {format(new Date(task.dueDate + "T00:00:00"), "MMM d, yyyy")}
                {isOverdue && <span className="ml-1">(Overdue)</span>}
              </span>
            )}
            {task.dueTime && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {task.dueTime}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons — always visible */}
        {!isCompleted && (
          <div className={`flex items-center gap-1 flex-shrink-0 ${compact ? "mt-0" : "md:mt-1"}`}>
            {/* Edit */}
            <Link href={`/tasks/${task.id}/edit`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Edit task"
                data-testid={`button-edit-task-${task.id}`}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>

            {/* Reschedule */}
            <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                  title="Reschedule task"
                  data-testid={`button-reschedule-task-${task.id}`}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarUI
                  mode="single"
                  selected={task.dueDate ? new Date(task.dueDate + "T00:00:00") : undefined}
                  onSelect={handleReschedule}
                  initialFocus
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  title="Delete task"
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "<strong>{task.title}</strong>" will be permanently removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Completed state action: only allow delete */}
        {isCompleted && (
          <div className="flex-shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "<strong>{task.title}</strong>" will be permanently removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Card>
  );
}
