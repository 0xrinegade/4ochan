import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeOptionProps {
  name: string;
  displayName: string;
  color: string;
  currentTheme: string;
  onClick: () => void;
}

// Get theme display names and colors for better UX
const getThemeInfo = (themeName: string): { displayName: string, color: string } => {
  const themeMap: Record<string, { displayName: string, color: string }> = {
    crimson: { 
      displayName: "Classic Red", 
      color: "#8B0000"
    },
    hotdogstand: { 
      displayName: "Retro Red", 
      color: "#D82C20"
    },
    windows95: { 
      displayName: "Classic Blue", 
      color: "#000080"
    },
    vaporwave: { 
      displayName: "Lavender", 
      color: "#7B68EE"
    },
    matrix: { 
      displayName: "Dark Mode", 
      color: "#00CC00"
    }
  };
  
  return themeMap[themeName] || { 
    displayName: themeName.charAt(0).toUpperCase() + themeName.slice(1), 
    color: "#333333" 
  };
};

const ThemeOption: React.FC<ThemeOptionProps> = ({ name, displayName, color, currentTheme, onClick }) => {
  const isActive = name === currentTheme;
  
  return (
    <button
      onClick={onClick}
      className={`relative px-2 py-1 mr-2 mb-2 text-sm border-2 border-black transition-transform ${
        isActive ? 'border-primary bg-white transform -translate-y-0.5' : 'bg-white hover:-translate-y-0.5'
      }`}
      style={{ 
        boxShadow: isActive ? `0 4px 0 ${color}` : '2px 2px 0 #000',
        borderColor: isActive ? color : 'black'
      }}
    >
      <div className="flex items-center">
        <div 
          className="w-3 h-3 mr-1 border border-black"
          style={{ backgroundColor: color }}
        ></div>
        {displayName}
        {isActive && <span className="ml-1">✓</span>}
      </div>
    </button>
  );
};

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="mb-4">
      <div className="bg-primary text-white py-1 px-2 font-bold text-sm flex items-center">
        <span className="mr-1">■</span> THEME SELECTOR
      </div>
      <div className="bg-white border-2 border-black border-t-0 p-3">
        <div className="mb-2 text-xs">Choose your preferred theme:</div>
        <div className="flex flex-wrap">
          {themes.map((theme) => {
            const { displayName, color } = getThemeInfo(theme);
            return (
              <ThemeOption
                key={theme}
                name={theme}
                displayName={displayName}
                color={color}
                currentTheme={currentTheme}
                onClick={() => setTheme(theme)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};