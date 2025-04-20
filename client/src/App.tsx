import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Thread from "@/pages/Thread";
import UserProfilePage from "@/pages/UserProfilePage";
import DesignSystem from "@/pages/DesignSystem";
import { TestPage } from "./pages/TestPage";
import { SubscriptionsPage } from "./pages/Subscriptions";
import TokenTestPage from "./pages/TokenTestPage";
import MusicTest from "./pages/MusicTest";
import FAQ from "./pages/FAQ";
import { NostrProvider } from "./context/NostrContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NavigationProvider } from "./context/NavigationContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import PageTransition from "./components/PageTransition";
import FloatingNavigation from "./components/FloatingNavigation";
import PwaInstallBanner from "./components/PwaInstallBanner";
import PwaOnboardingTour from "./components/PwaOnboardingTour";
import { AccessibilityButton } from "./components/AccessibilityButton";
import { useEffect, useState, useCallback } from "react";

// Create a module-level variable to hold the navigate function
let globalNavigate: ((to: string) => void) | null = null;

// Global function to navigate without page reload
// We'll use this to override normal anchor clicks
export const navigateWithoutReload = (href: string) => {
  if (globalNavigate) {
    globalNavigate(href);
  } else {
    console.error("Navigation function not initialized");
    window.location.href = href; // Fallback
  }
  return false; // Prevent default behavior
};

// Link interceptor to handle clicks on regular <a> elements
const setupLinkInterceptor = (navigate: (to: string) => void) => {
  document.addEventListener('click', (e) => {
    // Cast target to HTMLElement
    const target = e.target as HTMLElement;
    
    // Find the closest anchor element
    const anchor = target.closest('a');
    
    // If there's no anchor or it's an external link, let the default behavior happen
    if (!anchor || !anchor.href || anchor.target === '_blank' || 
        anchor.getAttribute('rel') === 'external' ||
        anchor.href.startsWith('http')) {
      return;
    }
    
    // Get the URL
    const url = new URL(anchor.href);
    
    // Only intercept links to the same origin
    if (url.origin !== window.location.origin) {
      return;
    }
    
    // Prevent default behavior
    e.preventDefault();
    
    // Use wouter's navigate to go to the path
    navigate(url.pathname);
  });
};

function AppRouter() {
  // Use wouter's location hook for navigation
  const [location, setLocation] = useLocation();
  
  // Store the navigate function globally so it can be used by our helper
  globalNavigate = setLocation;
  
  // Set up link interceptor once on mount
  useEffect(() => {
    setupLinkInterceptor(setLocation);
  }, [setLocation]);
  
  // Memoize the parameters to avoid unnecessary re-renders
  const getRouteParams = useCallback(() => {
    // Board routes
    if (location.startsWith("/board/")) {
      return { boardId: location.split("/board/")[1] };
    }
    
    // Thread routes with optional replyId
    if (location.startsWith("/thread/")) {
      const parts = location.split("/thread/")[1].split('/reply/');
      if (parts.length > 1) {
        return { threadId: parts[0], replyId: parts[1] };
      }
      return { threadId: parts[0] };
    }
    
    // Profile routes 
    if (location.startsWith("/profile/")) {
      return { userId: location.split("/profile/")[1] };
    }
    
    return {};
  }, [location]);
  
  const params = getRouteParams();
  
  // Render the appropriate component
  return (
    <PageTransition>
      <Switch>
        <Route path="/">
          <Home />
        </Route>
        <Route path="/board/:id">
          {(params) => <Home id={params.id} key={`board-${params.id}`} />}
        </Route>
        <Route path="/thread/:id/reply/:replyId">
          {(params) => <Thread id={params.id} replyId={params.replyId} key={`thread-${params.id}-reply-${params.replyId}`} />}
        </Route>
        <Route path="/thread/:id">
          {(params) => <Thread id={params.id} key={`thread-${params.id}`} />}
        </Route>
        <Route path="/profile">
          <UserProfilePage />
        </Route>
        <Route path="/profile/:id">
          {(params) => <UserProfilePage id={params.id} key={`profile-${params.id}`} />}
        </Route>
        <Route path="/design">
          <DesignSystem />
        </Route>
        <Route path="/test">
          <TestPage />
        </Route>
        <Route path="/subscriptions">
          <SubscriptionsPage />
        </Route>
        <Route path="/token-test">
          <TokenTestPage />
        </Route>
        <Route path="/faq">
          <FAQ />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NostrProvider>
          <NavigationProvider>
            <AccessibilityProvider>
              <AppRouter />
              <FloatingNavigation />
              <PwaInstallBanner />
              <PwaOnboardingTour />
              <AccessibilityButton />
              <Toaster />
            </AccessibilityProvider>
          </NavigationProvider>
        </NostrProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
