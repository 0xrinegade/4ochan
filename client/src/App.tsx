import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Thread from "@/pages/Thread";
import UserProfilePage from "@/pages/UserProfilePage";
import DesignSystem from "@/pages/DesignSystem";
import { TestPage } from "./pages/TestPage";
import { NostrProvider } from "./context/NostrContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavigationProvider } from "./context/NavigationContext";
import PageTransition from "./components/PageTransition";
import { useEffect, useState } from "react";

function AppRouter() {
  // Get the current path from the window location
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Update the current path when it changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
  
  // Determine which component to render based on the current path
  const renderComponent = () => {
    // Parse the path to determine the route
    if (currentPath === "/") {
      return <Home />;
    }
    
    // Board routes
    if (currentPath.startsWith("/board/")) {
      const boardId = currentPath.split("/board/")[1];
      return <Home id={boardId} />;
    }
    
    // Thread routes
    if (currentPath.startsWith("/thread/")) {
      const threadId = currentPath.split("/thread/")[1];
      return <Thread id={threadId} />;
    }
    
    // Profile routes
    if (currentPath === "/profile") {
      return <UserProfilePage />;
    }
    
    if (currentPath.startsWith("/profile/")) {
      const userId = currentPath.split("/profile/")[1];
      return <UserProfilePage id={userId} />;
    }
    
    // Other static routes
    if (currentPath === "/design") {
      return <DesignSystem />;
    }
    
    if (currentPath === "/test") {
      return <TestPage />;
    }
    
    // Not found
    return <NotFound />;
  };
  
  return (
    <PageTransition>
      {renderComponent()}
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NostrProvider>
          <NavigationProvider>
            <AppRouter />
            <Toaster />
          </NavigationProvider>
        </NostrProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
