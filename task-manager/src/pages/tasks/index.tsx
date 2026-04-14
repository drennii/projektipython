import { useState } from "react";
import { Link } from "wouter";
import { useGetTasks, getGetTasksQueryKey, useGetCategories, getGetCategoriesQueryKey, Task } from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Filter, SlidersHorizontal, LayoutList, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TaskList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams: any = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (priorityFilter !== "all") queryParams.priority = priorityFilter;
  if (categoryFilter !== "all") queryParams.category = categoryFilter;

  const { data: tasks, isLoading } = useGetTasks(queryParams, {
    query: { queryKey: getGetTasksQueryKey(queryParams) }
  });

  const { data: categories } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() }
  });

  // Client-side search filtering
  const filteredTasks = tasks?.filter(task => 
    searchQuery === "" || 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutList className="h-8 w-8 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage and organize everything you need to do.</p>
        </div>
        <Link href="/tasks/new">
          <Button size="lg" className="rounded-xl h-12 shadow-sm whitespace-nowrap">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Task
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="border-none shadow-sm bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-10 h-12 text-base rounded-xl border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl border-muted-foreground/20 text-base">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl border-muted-foreground/20 text-base">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Priority" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {categories && categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-12 rounded-xl border-muted-foreground/20 text-base">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-muted rounded-2xl"></div>
            ))}
          </div>
        ) : filteredTasks && filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="text-center py-20 px-4">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary opacity-80" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No tasks found</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" 
                ? "Try adjusting your filters to see more tasks." 
                : "You don't have any tasks yet. Create your first task to get started!"}
            </p>
            {(!searchQuery && statusFilter === "all" && priorityFilter === "all") ? (
              <Link href="/tasks/new">
                <Button size="lg" className="rounded-xl h-14 px-8 text-lg shadow-md">
                  <PlusCircle className="mr-2 h-6 w-6" />
                  Create First Task
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                }}
                className="rounded-xl h-12"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
