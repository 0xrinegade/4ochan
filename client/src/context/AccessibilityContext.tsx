import React, { createContext, useContext, useState, useEffect } from 'react';

// Define accessibility mode types
type AccessibilityMode = 'default' | 'high-contrast' | 'simplified' | 'dyslexia-friendly';

// Interface for our context
interface AccessibilityContextType {
  /** Current accessibility mode */
  mode: AccessibilityMode;
  /** Whether font size is increased */
  largerText: boolean;
  /** Whether to reduce animations */
  reduceAnimations: boolean;
  /** Whether to enable screen reader optimizations */
  screenReaderMode: boolean;
  /** Whether to use monospace font for code blocks */
  monospaceFonts: boolean;
  /** Set the accessibility mode */
  setMode: (mode: AccessibilityMode) => void;
  /** Toggle larger text */
  toggleLargerText: () => void;
  /** Toggle reduced animations */
  toggleReduceAnimations: () => void;
  /** Toggle screen reader optimizations */
  toggleScreenReaderMode: () => void;
  /** Toggle monospace fonts */
  toggleMonospaceFonts: () => void;
  /** Apply a one-click accessibility preset */
  applyAccessibilityPreset: (preset: 'vision' | 'cognitive' | 'motor' | 'reset') => void;
}

// Create the context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Custom hook to use the accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

// Provider component
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  // Initialize state from localStorage if available, otherwise use defaults
  const [mode, setModeState] = useState<AccessibilityMode>(() => {
    const savedMode = localStorage.getItem('accessibility-mode');
    return savedMode as AccessibilityMode || 'default';
  });
  
  const [largerText, setLargerText] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-larger-text') === 'true';
  });
  
  const [reduceAnimations, setReduceAnimations] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-reduce-animations') === 'true';
  });
  
  const [screenReaderMode, setScreenReaderMode] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-screen-reader') === 'true';
  });
  
  const [monospaceFonts, setMonospaceFonts] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-monospace-fonts') === 'true';
  });

  // Update the HTML element's data attributes and classes when settings change
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('accessibility-mode', mode);
    localStorage.setItem('accessibility-larger-text', largerText.toString());
    localStorage.setItem('accessibility-reduce-animations', reduceAnimations.toString());
    localStorage.setItem('accessibility-screen-reader', screenReaderMode.toString());
    localStorage.setItem('accessibility-monospace-fonts', monospaceFonts.toString());

    // Update HTML element attributes/classes
    const htmlElement = document.documentElement;

    // Reset all accessibility classes first
    htmlElement.classList.remove('larger-text', 'reduce-animations', 'high-contrast');
    htmlElement.removeAttribute('data-accessibility-mode');

    // Apply current settings
    if (mode !== 'default') {
      htmlElement.setAttribute('data-accessibility-mode', mode);
    }

    if (largerText) {
      htmlElement.classList.add('larger-text');
    }

    if (reduceAnimations) {
      htmlElement.classList.add('reduce-animations');
    }

    if (mode === 'high-contrast') {
      htmlElement.classList.add('high-contrast');
    }

    // Update ARIA attributes for screen readers
    if (screenReaderMode) {
      document.body.setAttribute('aria-live', 'polite');
      const buttons = document.querySelectorAll('button:not([aria-label])');
      buttons.forEach(button => {
        const text = button.textContent || '';
        if (text) button.setAttribute('aria-label', text);
      });
    } else {
      document.body.removeAttribute('aria-live');
    }
  }, [mode, largerText, reduceAnimations, screenReaderMode, monospaceFonts]);

  // Set mode function
  const setMode = (newMode: AccessibilityMode) => {
    setModeState(newMode);
  };

  // Toggle functions for each setting
  const toggleLargerText = () => {
    setLargerText(prev => !prev);
  };

  const toggleReduceAnimations = () => {
    setReduceAnimations(prev => !prev);
  };

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(prev => !prev);
  };

  const toggleMonospaceFonts = () => {
    setMonospaceFonts(prev => !prev);
  };

  // Apply accessibility presets
  const applyAccessibilityPreset = (preset: 'vision' | 'cognitive' | 'motor' | 'reset') => {
    switch (preset) {
      case 'vision':
        // High contrast, larger text, screen reader optimizations
        setMode('high-contrast');
        setLargerText(true);
        setScreenReaderMode(true);
        setReduceAnimations(true);
        break;
      case 'cognitive':
        // Dyslexia-friendly, reduced animations, simplified
        setMode('dyslexia-friendly');
        setReduceAnimations(true);
        setLargerText(true);
        setMonospaceFonts(false);
        break;
      case 'motor':
        // Larger clickable elements, simplified interface
        setMode('simplified');
        setLargerText(true);
        break;
      case 'reset':
        // Reset all settings to default
        setMode('default');
        setLargerText(false);
        setReduceAnimations(false);
        setScreenReaderMode(false);
        setMonospaceFonts(false);
        break;
    }
  };

  // Create the context value object
  const contextValue: AccessibilityContextType = {
    mode,
    largerText,
    reduceAnimations,
    screenReaderMode,
    monospaceFonts,
    setMode,
    toggleLargerText,
    toggleReduceAnimations,
    toggleScreenReaderMode,
    toggleMonospaceFonts,
    applyAccessibilityPreset,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};