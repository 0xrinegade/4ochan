import React, { createContext, useContext, useState, useEffect } from 'react';

type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

interface NavigationContextType {
  transitionState: TransitionState;
  currentPath: string;
  previousPath: string | null;
  navigateTo: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  transitionState: 'entered',
  currentPath: '/',
  previousPath: null,
  navigateTo: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transitionState, setTransitionState] = useState<TransitionState>('entered');
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setPreviousPath(currentPath);
      setCurrentPath(window.location.pathname);
      triggerTransition();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath]);

  // Handle initial load
  useEffect(() => {
    setTransitionState('entered');
  }, []);

  const triggerTransition = () => {
    // Trigger exit animation
    setTransitionState('exiting');
    
    // After exit animation, load the new page and trigger enter animation
    setTimeout(() => {
      setTransitionState('exited');
      
      // Short delay to ensure DOM updates
      setTimeout(() => {
        setTransitionState('entering');
        
        // After enter animation completes
        setTimeout(() => {
          setTransitionState('entered');
        }, 300); // Match with CSS transition duration
      }, 50);
    }, 300); // Match with CSS transition duration
  };

  const navigateTo = (path: string) => {
    if (path === currentPath) return;
    
    setPreviousPath(currentPath);
    
    // Start the transition
    triggerTransition();
    
    // Update history after exit animation
    setTimeout(() => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }, 300); // Match with CSS transition duration
  };

  return (
    <NavigationContext.Provider
      value={{
        transitionState,
        currentPath,
        previousPath,
        navigateTo,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};