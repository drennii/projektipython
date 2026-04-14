import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/hooks/use-theme";

import { Dashboard } from "@/pages/dashboard";
import { TaskList } from "@/pages/tasks/index";
import { TaskForm } from "@/pages/tasks/form";
import { CalendarView } from "@/pages/calendar";
import { Categories } from "@/pages/categories";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={TaskList} />
        <Route path="/tasks/new" component={TaskForm} />
        <Route path="/tasks/:id/edit" component={TaskForm} />
        <Route path="/calendar" component={CalendarView} />
        <Route path="/categories" component={Categories} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
