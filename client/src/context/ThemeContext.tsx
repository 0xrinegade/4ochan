import React, { createContext, useContext, useState, useEffect } from 'react';

// Define theme types based on theme.json
type ThemeName = 'crimson' | 'hotdogstand' | 'windows95' | 'vaporwave' | 'matrix';

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

// Theme configuration from theme.json
const themeSettings: ThemeSettings = {
  crimson: {
    primary: '#8B0000',   // Dark red primary
    background: '#F5F5DC', // Beige background
    buttonBackground: '#D3D3D3', // Light gray buttons
    buttonText: '#000000'   // Black text on buttons
  },
  hotdogstand: {
    primary: '#FF0000',    // Bright red
    background: '#FFFF00',  // Bright yellow
    buttonBackground: '#FF0000', // Red buttons
    buttonText: '#FFFF00',  // Yellow text on buttons
    text: '#000000'         // Black for main text
  },
  windows95: {
    primary: '#000080',    // Classic Windows 95 blue
    background: '#C0C0C0',  // Windows 95 gray
    buttonBackground: '#C0C0C0', // Gray buttons
    buttonText: '#000000',  // Black text on buttons
    text: '#000000'         // Black text
  },
  vaporwave: {
    primary: '#FF00FF',    // Magenta/pink
    background: '#00FFFF',  // Cyan
    buttonBackground: '#FF00FF', // Pink buttons
    buttonText: '#FFFFFF',  // White text on buttons
    text: '#000080'         // Navy blue text
  },
  matrix: {
    primary: '#00FF00',    // Bright matrix green
    background: '#000000',  // Black background
    text: '#00FF00',        // Green text
    buttonBackground: '#003300', // Dark green buttons
    buttonText: '#00FF00'   // Green text on buttons
  }
};

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'crimson',
  setTheme: () => {},
  themes: ['crimson', 'hotdogstand', 'windows95', 'vaporwave', 'matrix']
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to get theme from localStorage, default to crimson
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeName;
    return savedTheme && themeSettings[savedTheme] ? savedTheme : 'crimson';
  });

  const themes: ThemeName[] = ['crimson', 'hotdogstand', 'windows95', 'vaporwave', 'matrix'];

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
      
      // Set text color if specified, otherwise default to black/white based on background
      if (colors.text) {
        const textHSL = hexToHSL(colors.text);
        document.documentElement.style.setProperty('--foreground', textHSL);
        document.documentElement.style.setProperty('--card-foreground', textHSL);
        document.documentElement.style.setProperty('--popover-foreground', textHSL);
      } else if (theme === 'matrix') {
        // Matrix theme needs green text throughout
        const textHSL = hexToHSL('#00FF00');
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
      
      // For Matrix theme, set all border colors to match the green
      if (theme === 'matrix') {
        document.documentElement.style.setProperty('--border', hexToHSL('#00FF00'));
      }
      
      // Set primary foreground color (text on primary backgrounds)
      if (theme === 'hotdogstand') {
        document.documentElement.style.setProperty('--primary-foreground', hexToHSL('#FFFF00'));
      } else if (theme === 'matrix') {
        document.documentElement.style.setProperty('--primary-foreground', hexToHSL('#000000'));
      } else {
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