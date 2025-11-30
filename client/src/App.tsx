import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import CalendarPage from "@/pages/calendar";
import ProjectsPage from "@/pages/projects";
import KanbanPage from "@/pages/kanban";
import NotFound from "@/pages/not-found";
import NavBar from "@/components/NavBar";

function Router() {
  return (
      <Switch>
      <Route path="/" component={CalendarPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/kanban" component={KanbanPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <NavBar />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
