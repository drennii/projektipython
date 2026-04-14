import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, AlignLeft, Tag, Flag, Save, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { useCreateTask, useUpdateTask, useGetTask, getGetTaskQueryKey, useGetCategories, getGetCategoriesQueryKey, getGetTasksQueryKey, CreateTaskRequestPriority, UpdateTaskRequestStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Task title is required").max(100),
  description: z.string().optional(),
  categoryId: z.string().optional().transform(v => v ? parseInt(v, 10) : undefined),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Time must be HH:MM format"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TaskForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id;
  const taskId = params.id ? parseInt(params.id, 10) : 0;
  const queryClient = useQueryClient();

  const { data: task, isLoading: isLoadingTask } = useGetTask(taskId, {
    query: { enabled: isEditing, queryKey: getGetTaskQueryKey(taskId) }
  });

  const { data: categories } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() }
  });

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueTime: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (isEditing && task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        categoryId: task.categoryId?.toString() || undefined,
        priority: task.priority as any,
        status: task.status as any,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        dueTime: task.dueTime || "",
        notes: task.notes || ""
      });
    }
  }, [isEditing, task, form]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      dueDate: data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: taskId, data: payload }, {
        onSuccess: () => {
          toast.success("Task updated successfully!");
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setLocation("/tasks");
        },
        onError: () => toast.error("Failed to update task.")
      });
    } else {
      createMutation.mutate({ data: payload as any }, {
        onSuccess: () => {
          toast.success("Task created successfully!");
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setLocation("/tasks");
        },
        onError: () => toast.error("Failed to create task.")
      });
    }
  };

  if (isEditing && isLoadingTask) {
    return <div className="p-8 text-center text-lg">Loading task details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center mb-8 gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tasks")} className="h-10 w-10 rounded-full bg-muted/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Edit Task" : "Create New Task"}
        </h1>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">What needs to be done?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Call the dentist for appointment" 
                        className="h-14 text-lg rounded-xl bg-muted/30 focus-visible:bg-background" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-base flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-12 pl-3 text-left font-normal rounded-xl bg-muted/30 hover:bg-muted/50",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-5 w-5 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2"><Clock className="h-4 w-4"/> Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="h-12 rounded-xl bg-muted/30 focus-visible:bg-background" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2"><Flag className="h-4 w-4"/> Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 focus-visible:bg-background">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - When I have time</SelectItem>
                          <SelectItem value="medium">Medium - Important</SelectItem>
                          <SelectItem value="high">High - Very Important</SelectItem>
                          <SelectItem value="urgent">Urgent - Do it now</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2"><Tag className="h-4 w-4"/> Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 focus-visible:bg-background">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No Category</SelectItem>
                          {categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Current Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center gap-2"><AlignLeft className="h-4 w-4"/> Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add some details about this task..." 
                        className="min-h-[120px] rounded-xl bg-muted/30 focus-visible:bg-background resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6 flex gap-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1 h-14 rounded-xl text-lg shadow-md"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isEditing ? "Save Changes" : "Create Task"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 rounded-xl text-lg"
                  onClick={() => setLocation("/tasks")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
