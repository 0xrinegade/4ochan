import React, { createContext, useContext, useState, useEffect } from 'react';

// Define theme types based on VS Code-style themes
type ThemeName = 'light' | 'dark' | 'highcontrast' | 'retro' | 'sepia';

interface ThemeColors {
  primary: string;
  background: string;
  buttonBackground?: string;
  buttonText?: string;
  text?: string;
  [key: string]: string | undefined;
}

interface ThemeSettings {
  [key: string]: ThemeColors;
}

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeName[];
}

// Theme configuration based on VS Code style themes
const themeSettings: ThemeSettings = {
  light: {
    primary: '#0066B8',     // VS Code blue
    background: '#FFFFFF',  // White background
    buttonBackground: '#0066B8',  // Blue buttons
    buttonText: '#FFFFFF',  // White text on buttons
    text: '#333333',        // Dark gray for text
    border: '#CCCCCC'       // Light gray borders
  },
  dark: {
    primary: '#0098FF',     // Bright blue for dark theme
    background: '#1E1E1E',  // VS Code dark gray
    buttonBackground: '#3A3D41', // Dark gray buttons
    buttonText: '#FFFFFF',  // White text on buttons
    text: '#D4D4D4',        // Light gray text
    border: '#3A3D41'       // Dark borders
  },
  highcontrast: {
    primary: '#FFFF00',     // Bright yellow
    background: '#000000',  // Black
    buttonBackground: '#000000', // Black buttons with yellow borders
    buttonText: '#FFFFFF',  // White text
    text: '#FFFFFF',        // White text
    border: '#FFFF00'       // Yellow borders
  },
  retro: {
    primary: '#000080',     // Navy blue
    background: '#D4D0C8',  // Classic gray  
    buttonBackground: '#D4D0C8', // Gray buttons
    buttonText: '#000000',  // Black text on buttons
    text: '#000000',        // Black text
    border: '#808080'       // Gray borders
  },
  sepia: {
    primary: '#8B4000',     // Brown
    background: '#F4ECD8',  // Sepia background
    buttonBackground: '#C09465', // Tan buttons
    buttonText: '#000000',  // Black text on buttons
    text: '#5B4636',        // Dark brown text
    border: '#C09465'       // Tan borders
  }
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'light',
  setTheme: () => {},
  themes: ['light', 'dark', 'highcontrast', 'retro', 'sepia']
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to get theme from localStorage, default to light
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    return savedTheme && themeSettings[savedTheme] ? savedTheme : 'light';
  });

  const themes: ThemeName[] = ['light', 'dark', 'highcontrast', 'retro', 'sepia'];

  // Function to convert hex to hsl
  const hexToHSL = (hex: string): string => {
    // Remove the # if it's there
    hex = hex.replace('#', '');
    
    // Convert hex to rgb
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // Find max and min values to calculate saturation
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let l = (max + min) / 2;
    let s = 0;
    let h = 0;
    
    if (max !== min) {
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
      
      if (max === r) {
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
      } else if (max === g) {
        h = (b - r) / (max - min) + 2;
      } else {
        h = (r - g) / (max - min) + 4;
      }
      
      h /= 6;
    }
    
    // Convert h, s, l to the 0-100 range expected by CSS
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    // Return the HSL string in the format Tailwind CSS uses
    return `${h} ${s}% ${l}%`;
  };

  // Update theme in localStorage and apply CSS variables
  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Remove all theme classes
    document.body.className = '';
    
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Apply theme colors directly to CSS variables
    if (themeSettings[theme]) {
      const colors = themeSettings[theme];
      
      // Set primary color
      if (colors.primary) {
        const primaryHSL = hexToHSL(colors.primary);
        document.documentElement.style.setProperty('--primary', primaryHSL);
        document.documentElement.style.setProperty('--ring', primaryHSL);
      }
      
      // Set background color
      if (colors.background) {
        document.documentElement.style.setProperty('--background', hexToHSL(colors.background));
        
        // Set card and popover background to match theme
        document.documentElement.style.setProperty('--card', hexToHSL(colors.background));
        document.documentElement.style.setProperty('--popover', hexToHSL(colors.background));
      }
      
      // Set text color if specified
      if (colors.text) {
        const textHSL = hexToHSL(colors.text);
        document.documentElement.style.setProperty('--foreground', textHSL);
        document.documentElement.style.setProperty('--card-foreground', textHSL);
        document.documentElement.style.setProperty('--popover-foreground', textHSL);
      }
      
      // Set button background color
      if (colors.buttonBackground) {
        document.documentElement.style.setProperty('--secondary', hexToHSL(colors.buttonBackground));
      }
      
      // Set button text color
      if (colors.buttonText) {
        document.documentElement.style.setProperty('--secondary-foreground', hexToHSL(colors.buttonText));
      }
      
      // Set border color if specified
      if (colors.border) {
        document.documentElement.style.setProperty('--border', hexToHSL(colors.border));
      }
      
      // Handle specific theme settings
      if (theme === 'highcontrast') {
        // High contrast theme needs specific foreground settings
        document.documentElement.style.setProperty('--primary-foreground', hexToHSL('#000000'));
      } else {
        // Default primary foreground is white for better contrast
        document.documentElement.style.setProperty('--primary-foreground', hexToHSL('#FFFFFF'));
      }
      
      console.log(`Theme changed to ${theme}`);
    }
  };

  // Set initial theme on mount
  useEffect(() => {
    setTheme(currentTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};