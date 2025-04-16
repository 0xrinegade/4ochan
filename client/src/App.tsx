import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Thread from "@/pages/Thread";
import UserProfilePage from "@/pages/UserProfilePage";
import DesignSystem from "@/pages/DesignSystem";
import { NostrProvider } from "./context/NostrContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/board/:id" component={Home} />
      <Route path="/thread/:id" component={Thread} />
      <Route path="/profile" component={UserProfilePage} />
      <Route path="/profile/:id" component={UserProfilePage} />
      <Route path="/design" component={DesignSystem} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NostrProvider>
        <Router />
        <Toaster />
      </NostrProvider>
    </QueryClientProvider>
  );
}

export default App;
