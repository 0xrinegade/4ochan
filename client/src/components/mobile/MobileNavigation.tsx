import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Home, MessageSquare, Bell, Search, PlusCircle, User, Settings, ChevronUp, ChevronDown } from 'lucide-react';
import { navigateWithoutReload } from '@/App';
import { useNostr } from '@/hooks/useNostr';
import { useScrollPosition } from '@/hooks/useScrollPosition';

/**
 * Modern bottom navigation bar optimized for mobile devices and PWA
 * Includes auto-hide on scroll functionality and center floating navigation buttons
 */
const MobileNavigation: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { identity } = useNostr();
  const { direction, isScrolling, isAtTop, y } = useScrollPosition();
  const [isVisible, setIsVisible] = useState(true);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  // Handle navigation visibility based on scroll
  useEffect(() => {
    // Always show nav when at the top of the page
    if (isAtTop) {
      setIsVisible(true);
      setShowScrollButtons(false);
      return;
    }

    // Show scroll buttons when scrolling
    if (isScrolling) {
      setShowScrollButtons(true);
      
      // After a delay, hide the scroll buttons if not scrolling
      const timeout = setTimeout(() => {
        if (!isScrolling) {
          setShowScrollButtons(false);
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
    
    // Hide navigation when scrolling down, show when scrolling up
    if (direction === 'down' && y > 100) {
      setIsVisible(false);
    } else if (direction === 'up') {
      setIsVisible(true);
    }
  }, [direction, isScrolling, isAtTop, y]);
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  const handleCreate = () => {
    // Find and trigger the create thread button
    const createThreadBtn = document.querySelector('[aria-label="Create New Thread"]') as HTMLButtonElement;
    if (createThreadBtn) {
      createThreadBtn.click();
    } else {
      // Fallback - we should navigate to a board where thread creation is possible
      navigateWithoutReload('/board/b');
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };
  
  return (
    <>
      {/* Main bottom navigation bar with auto hide */}
      <nav className={`fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-950/80 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-around px-2 z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <NavButton 
          icon={<Home size={20} strokeWidth={1.75} />} 
          label="Home" 
          active={isActive('/')}
          onClick={() => navigateWithoutReload('/')}
        />
        
        <NavButton 
          icon={<MessageSquare size={20} strokeWidth={1.75} />} 
          label="Threads" 
          active={isActive('/board')}
          onClick={() => navigateWithoutReload('/board/all')}
        />
        
        <NavButton 
          icon={<PlusCircle size={24} strokeWidth={1.5} />} 
          label="Create" 
          active={false}
          onClick={handleCreate}
          primary
        />
        
        <NavButton 
          icon={<Bell size={20} strokeWidth={1.75} />} 
          label="Subs" 
          active={isActive('/subscriptions')}
          onClick={() => navigateWithoutReload('/subscriptions')}
        />
        
        <NavButton 
          icon={<User size={20} strokeWidth={1.75} />} 
          label="Me" 
          active={isActive('/user')}
          onClick={() => identity?.pubkey 
            ? navigateWithoutReload(`/user/${identity.pubkey}`) 
            : navigateWithoutReload('/profile')
          }
        />
      </nav>
      
      {/* Floating scroll buttons (appear when scrolling) */}
      <div className={`fixed inset-x-0 bottom-1/2 flex justify-center items-center gap-4 z-40 transition-opacity duration-300 pointer-events-none ${showScrollButtons ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-primary/90 text-white shadow-lg flex items-center justify-center pointer-events-auto"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>
        
        <button 
          onClick={scrollToBottom}
          className="w-10 h-10 rounded-full bg-primary/90 text-white shadow-lg flex items-center justify-center pointer-events-auto"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    </>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  primary?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  active, 
  onClick,
  primary = false
}) => {
  return (
    <button
      className={`flex flex-col items-center justify-center w-16 py-1 relative transition-all ${
        primary 
          ? 'text-primary dark:text-primary' 
          : active 
            ? 'text-gray-900 dark:text-white' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={onClick}
    >
      {primary && (
        <div className="absolute inset-x-3 top-0 bottom-4 bg-primary/10 dark:bg-primary/20 rounded-full -z-10"></div>
      )}
      <div className={`${primary ? 'text-primary dark:text-primary transform -translate-y-1.5' : ''} transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-1 font-medium transition-opacity ${primary ? 'opacity-90' : active ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
      {active && !primary && (
        <div className="absolute bottom-0.5 h-1 w-1 bg-primary rounded-full" />
      )}
    </button>
  );
};

export default MobileNavigation;