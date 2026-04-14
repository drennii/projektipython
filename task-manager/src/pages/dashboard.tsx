import { useGetTasksSummary, useGetUpcomingTasks, useGetOverdueTasks, getGetTasksSummaryQueryKey, getGetUpcomingTasksQueryKey, getGetOverdueTasksQueryKey, getGetTasksQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, ListTodo, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TaskCard } from "@/components/task-card";

export function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetTasksSummary({
    query: { queryKey: getGetTasksSummaryQueryKey() }
  });
  
  const { data: upcoming, isLoading: isUpcomingLoading } = useGetUpcomingTasks({
    query: { queryKey: getGetUpcomingTasksQueryKey() }
  });
  
  const { data: overdue, isLoading: isOverdueLoading } = useGetOverdueTasks({
    query: { queryKey: getGetOverdueTasksQueryKey() }
  });

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  if (isSummaryLoading || isUpcomingLoading || isOverdueLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-2xl w-2/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          {greeting}!
        </h1>
        <p className="text-lg text-muted-foreground flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Today is {format(today, "EEEE, MMMM do, yyyy")}
        </p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Tasks" 
          value={summary?.total || 0} 
          icon={ListTodo} 
          color="text-primary" 
          bgColor="bg-primary/10" 
        />
        <StatCard 
          title="In Progress" 
          value={summary?.inProgress || 0} 
          icon={Clock} 
          color="text-blue-500" 
          bgColor="bg-blue-100 dark:bg-blue-900/20" 
        />
        <StatCard 
          title="Completed" 
          value={summary?.completed || 0} 
          icon={CheckCircle2} 
          color="text-green-600" 
          bgColor="bg-green-100 dark:bg-green-900/20" 
        />
        <StatCard 
          title="Overdue" 
          value={summary?.overdue || 0} 
          icon={AlertCircle} 
          color="text-red-500" 
          bgColor="bg-red-100 dark:bg-red-900/20" 
        />
      </div>

      {/* Overdue Alert */}
      {overdue && overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full text-red-600 dark:text-red-400 mt-1 md:mt-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">You have {overdue.length} overdue {overdue.length === 1 ? 'task' : 'tasks'}</h3>
              <p className="text-red-600 dark:text-red-400/80">Let's get these sorted out or reschedule them for another time.</p>
            </div>
          </div>
          <Link href="/tasks?status=pending">
            <Button variant="outline" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
              Review Overdue Tasks
            </Button>
          </Link>
        </div>
      )}

      {/* Upcoming Tasks */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Upcoming Tasks
          </h2>
          <Link href="/tasks">
            <Button variant="ghost" className="text-primary hover:text-primary/80 group">
              See all
              <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {upcoming && upcoming.length > 0 ? (
          <div className="grid gap-4">
            {upcoming.slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary opacity-80" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
              <p className="text-muted-foreground max-w-sm mb-6 text-lg">
                No tasks due in the next 7 days. Enjoy your free time or add a new task to get ahead.
              </p>
              <Link href="/tasks/new">
                <Button size="lg" className="rounded-xl h-12 text-base shadow-sm">
                  <Plus className="mr-2 h-5 w-5" />
                  Add New Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: { title: string, value: number, icon: any, color: string, bgColor: string }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex flex-col items-start gap-4">
        <div className={`${bgColor} ${color} p-3 rounded-xl`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-muted-foreground font-medium text-sm md:text-base">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}
