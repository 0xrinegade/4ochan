import React, { createContext, useContext, useState, useEffect } from 'react';

// Define theme types based on theme.json
type ThemeName = 'crimson' | 'hotdogstand' | 'windows95' | 'vaporwave' | 'matrix';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'crimson',
  setTheme: () => {},
  themes: ['crimson', 'hotdogstand', 'windows95', 'vaporwave', 'matrix']
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to get theme from localStorage, default to crimson
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeName) || 'crimson';
  });

  const themes: ThemeName[] = ['crimson', 'hotdogstand', 'windows95', 'vaporwave', 'matrix'];

  // Update theme in localStorage and apply CSS variables
  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme class to body
    document.body.className = `theme-${theme}`;
  };

  // Set initial theme on mount
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};