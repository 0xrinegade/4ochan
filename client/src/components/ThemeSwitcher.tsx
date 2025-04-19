import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeOptionProps {
  name: string;
  currentTheme: string;
  onClick: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ name, currentTheme, onClick }) => {
  const isActive = name === currentTheme;
  
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 mr-1 mb-1 text-xs border-2 border-black ${
        isActive ? 'bg-primary text-white' : 'bg-secondary'
      }`}
      style={{ boxShadow: '2px 2px 0 #000' }}
    >
      {name.toUpperCase()}
    </button>
  );
};

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="mb-2">
      <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
        <span className="mr-1">■</span> THEME SELECTOR
      </div>
      <div className="bg-white border border-black border-t-0 p-2">
        <div className="flex flex-wrap">
          {themes.map((theme) => (
            <ThemeOption
              key={theme}
              name={theme}
              currentTheme={currentTheme}
              onClick={() => setTheme(theme)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};