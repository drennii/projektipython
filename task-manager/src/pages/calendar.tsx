import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Flag,
  Tag,
  Edit2,
} from "lucide-react";
import { Link } from "wouter";
import { useGetTasks, getGetTasksQueryKey, useCompleteTask, getGetTasksSummaryQueryKey, getGetUpcomingTasksQueryKey, getGetOverdueTasksQueryKey } from "@workspace/api-client-react";
import type { Task } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const priorityConfig: Record<string, { dot: string; label: string; text: string; badgeBg: string }> = {
  urgent: { dot: "bg-red-500",    label: "Urgent",  text: "text-red-600",    badgeBg: "bg-red-100 text-red-700" },
  high:   { dot: "bg-orange-500", label: "High",    text: "text-orange-600", badgeBg: "bg-orange-100 text-orange-700" },
  medium: { dot: "bg-yellow-400", label: "Medium",  text: "text-yellow-600", badgeBg: "bg-yellow-100 text-yellow-700" },
  low:    { dot: "bg-green-500",  label: "Low",     text: "text-green-600",  badgeBg: "bg-green-100 text-green-700" },
};

function TaskHoverCard({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const completeMutation = useCompleteTask();
  const isCompleted = task.status === "completed";
  const isOverdue = !isCompleted && !!task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompleted) return;
    completeMutation.mutate({ id: task.id }, {
      onSuccess: () => {
        toast.success("Task completed!");
        queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTasksSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-3 w-72">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base leading-snug ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-green-500 transition-colors focus:outline-none disabled:cursor-not-allowed"
          title={isCompleted ? "Already done" : "Mark complete"}
        >
          {isCompleted
            ? <CheckCircle2 className="h-6 w-6 text-green-500" />
            : <Circle className="h-6 w-6" />}
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priority.badgeBg}`}>
          <Flag className="inline-block h-3 w-3 mr-1" />
          {priority.label}
        </span>
        {task.categoryName && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: task.categoryColor ? `${task.categoryColor}22` : "#e2e8f0",
              color: task.categoryColor ?? "#475569",
            }}
          >
            <Tag className="inline-block h-3 w-3 mr-1" />
            {task.categoryName}
          </span>
        )}
      </div>

      {/* Time + Notes */}
      {task.dueTime && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{task.dueTime}</span>
        </div>
      )}
      {isOverdue && (
        <div className="flex items-center gap-1.5 text-sm text-red-500 font-semibold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Overdue — needs attention</span>
        </div>
      )}
      {task.notes && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-2 line-clamp-2">
          {task.notes}
        </p>
      )}

      {/* Action link */}
      <div className="pt-1 border-t border-border/50">
        <Link href={`/tasks/${task.id}/edit`}>
          <button className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
            <Edit2 className="h-3.5 w-3.5" />
            Edit task
          </button>
        </Link>
      </div>
    </div>
  );
}

function CalendarDayCell({ day, tasks, isCurrentMonth }: {
  day: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
}) {
  const today = isToday(day);

  const pendingTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const overdueTasks = tasks.filter(t => {
    if (t.status === "completed" || t.status === "cancelled") return false;
    return t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  });

  return (
    <div
      className={`
        border-r border-b p-2 min-h-[120px] flex flex-col transition-colors
        ${today ? "bg-primary/5" : ""}
        ${!isCurrentMonth ? "bg-muted/20 opacity-50" : "hover:bg-muted/20"}
      `}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`
            text-sm font-semibold inline-flex items-center justify-center h-7 w-7 rounded-full
            ${today ? "bg-primary text-primary-foreground" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}
          `}
        >
          {format(day, "d")}
        </span>
        {tasks.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Task pills */}
      <div className="space-y-1 flex-1 overflow-hidden">
        {tasks.slice(0, 3).map((task) => {
          const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
          const isCompleted = task.status === "completed";

          return (
            <HoverCard key={task.id} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs font-medium
                    transition-all duration-150 hover:scale-[1.02] hover:shadow-sm select-none
                    ${isCompleted
                      ? "bg-muted text-muted-foreground line-through"
                      : "bg-white border border-border/60 hover:border-primary/40 text-foreground shadow-sm"
                    }
                  `}
                >
                  <span className={`flex-shrink-0 h-2 w-2 rounded-full ${priority.dot} ${isCompleted ? "opacity-40" : ""}`} />
                  <span className="truncate flex-1">{task.title}</span>
                  {isCompleted && <CheckCircle2 className="flex-shrink-0 h-3 w-3 text-green-500" />}
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                align="start"
                className="p-4 shadow-xl border rounded-2xl"
                sideOffset={8}
              >
                <TaskHoverCard task={task} />
              </HoverCardContent>
            </HoverCard>
          );
        })}

        {tasks.length > 3 && (
          <div className="text-xs text-muted-foreground font-medium px-2 py-0.5">
            +{tasks.length - 3} more
          </div>
        )}
      </div>

      {/* Overdue indicator dot */}
      {overdueTasks.length > 0 && (
        <div className="mt-1 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span className="text-xs text-red-500 font-medium">{overdueTasks.length} overdue</span>
        </div>
      )}
    </div>
  );
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: tasks } = useGetTasks({}, {
    query: { queryKey: getGetTasksQueryKey() }
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDate = (date: Date): Task[] => {
    if (!tasks) return [];
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate + "T00:00:00"), date)
    );
  };

  const totalThisMonth = tasks?.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate + "T00:00:00");
    return d >= monthStart && d <= monthEnd;
  }).length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {totalThisMonth > 0
              ? `${totalThisMonth} task${totalThisMonth !== 1 ? "s" : ""} scheduled in ${format(currentDate, "MMMM")}`
              : "Plan and see your tasks by date"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl font-semibold text-sm"
          >
            Today
          </Button>
          <div className="flex items-center bg-card border rounded-xl shadow-sm overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="rounded-none h-10 w-10 hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="px-4 font-bold text-base min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="rounded-none h-10 w-10 hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Priority:</span>
        {Object.entries(priorityConfig).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
            <span className="capitalize">{cfg.label}</span>
          </span>
        ))}
        <span className="ml-2 text-muted-foreground/60">— Hover any task for details</span>
      </div>

      {/* Calendar grid */}
      <Card className="border-none shadow-md overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day) => (
            <CalendarDayCell
              key={day.toISOString()}
              day={day}
              tasks={getTasksForDate(day)}
              isCurrentMonth={day >= monthStart && day <= monthEnd}
            />
          ))}
        </div>
      </Card>

      {/* Quick add prompt */}
      <div className="flex justify-center">
        <Link href="/tasks/new">
          <Button variant="outline" className="rounded-xl gap-2 text-base h-12 px-6">
            <CalendarIcon className="h-5 w-5" />
            Add a task with a due date
          </Button>
        </Link>
      </div>
    </div>
  );
}
