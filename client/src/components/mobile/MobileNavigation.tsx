import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, Menu, MessageSquare, User, Search, Bookmark, 
  Settings, Moon, Sun, Info, ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useNostr } from '@/context/NostrContext';
import { navigateWithoutReload } from '@/App';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 ${
        active ? 'text-accent' : 'text-foreground/70'
      }`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  );
};

const MobileNavigation: React.FC = () => {
  const [location] = useLocation();
  const { currentTheme, setTheme } = useTheme();
  const { identity } = useNostr();
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine current route for active state
  const isHome = location === '/' || location.startsWith('/board/');
  const isThread = location.startsWith('/thread/');
  const isProfile = location.startsWith('/profile/');

  const toggleTheme = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  const navigateTo = (path: string) => {
    navigateWithoutReload(path);
    setMenuOpen(false);
  };

  // If menu is open, show the expanded menu
  if (menuOpen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex flex-col animate-in fade-in slide-in-from-bottom">
        <div className="flex justify-between items-center p-4 bg-background border-b">
          <h2 className="text-lg font-bold">Menu</h2>
          <button 
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-full hover:bg-muted/50"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-background">
          <div className="grid grid-cols-2 p-4 gap-4">
            <button 
              onClick={() => navigateTo('/')} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              <Home size={24} className="mb-2" />
              <span>Home</span>
            </button>
            
            <button 
              onClick={() => navigateTo('/profile')} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              <User size={24} className="mb-2" />
              <span>Profile</span>
            </button>
            
            <button 
              onClick={() => navigateTo('/subscriptions')} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              <Bookmark size={24} className="mb-2" />
              <span>Subscriptions</span>
            </button>
            
            <button 
              onClick={toggleTheme} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              {theme === 'dark' ? (
                <Sun size={24} className="mb-2" />
              ) : (
                <Moon size={24} className="mb-2" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button 
              onClick={() => navigateTo('/faq')} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              <Info size={24} className="mb-2" />
              <span>FAQ</span>
            </button>
            
            <button 
              onClick={() => navigateTo('/settings')} 
              className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50"
            >
              <Settings size={24} className="mb-2" />
              <span>Settings</span>
            </button>
          </div>
          
          {/* Additional menu items */}
          <div className="p-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-bold mb-2">Boards</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigateTo('/board/b')} 
                  className="w-full text-left p-2 hover:bg-muted/80 rounded"
                >
                  /b/ - Random
                </button>
                <button 
                  onClick={() => navigateTo('/board/tech')} 
                  className="w-full text-left p-2 hover:bg-muted/80 rounded"
                >
                  /tech/ - Technology
                </button>
                <button 
                  onClick={() => navigateTo('/board/meta')} 
                  className="w-full text-left p-2 hover:bg-muted/80 rounded"
                >
                  /meta/ - Meta Discussion
                </button>
                <button 
                  onClick={() => navigateTo('/board/ai')} 
                  className="w-full text-left p-2 hover:bg-muted/80 rounded"
                >
                  /ai/ - Artificial Intelligence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default bottom navigation bar
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around px-2 z-40">
      <NavItem 
        icon={<Home size={24} />} 
        label="Home" 
        active={isHome}
        onClick={() => navigateTo('/')} 
      />
      
      <NavItem 
        icon={<MessageSquare size={24} />} 
        label="Threads" 
        active={isThread}
        onClick={() => navigateTo('/board/b')} 
      />
      
      <NavItem 
        icon={<Search size={24} />} 
        label="Search" 
        onClick={() => {
          // For now, just open the search dialog
          const searchBtn = document.querySelector('[title="Search the page"]') as HTMLButtonElement;
          if (searchBtn) searchBtn.click();
        }} 
      />
      
      <NavItem 
        icon={<User size={24} />} 
        label="Profile" 
        active={isProfile}
        onClick={() => navigateTo('/profile')} 
      />
      
      <NavItem 
        icon={<Menu size={24} />} 
        label="Menu" 
        onClick={() => setMenuOpen(true)} 
      />
    </div>
  );
};

export default MobileNavigation;