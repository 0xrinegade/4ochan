import React from 'react';
import { useLocation } from 'wouter';
import { useNostr } from '@/context/NostrContext';
import { ChevronLeft, Plus, Wifi, WifiOff } from 'lucide-react';
import { navigateWithoutReload } from '@/App';

const MobileHeader: React.FC = () => {
  const [location] = useLocation();
  const { connectedRelays, isConnecting } = useNostr();
  
  // Determine page title based on current route
  const getPageTitle = (): string => {
    if (location === '/') {
      return '4ochan';
    }
    
    if (location.startsWith('/board/')) {
      const boardId = location.split('/board/')[1];
      return `/${boardId}/`;
    }
    
    if (location.startsWith('/thread/')) {
      return 'Thread';
    }
    
    if (location.startsWith('/profile')) {
      return 'Profile';
    }
    
    if (location === '/faq') {
      return 'FAQ';
    }
    
    if (location === '/subscriptions') {
      return 'Subscriptions';
    }
    
    return '4ochan';
  };
  
  // Determine if we should show back button
  const showBackButton = (): boolean => {
    return location !== '/' && !location.startsWith('/board/');
  };
  
  // Handle back navigation
  const handleBack = () => {
    // If in a thread and came from a board, go back to that board
    if (location.startsWith('/thread/')) {
      const boardPath = localStorage.getItem('lastBoardPath') || '/';
      navigateWithoutReload(boardPath);
      return;
    }
    
    // Otherwise use browser history
    window.history.back();
  };
  
  // Handle new thread/post creation
  const handleNewContent = () => {
    if (location === '/' || location.startsWith('/board/')) {
      // Find new thread button and click it
      const newThreadBtn = document.querySelector('[aria-label="Create New Thread"]') as HTMLButtonElement;
      if (newThreadBtn) newThreadBtn.click();
    } else if (location.startsWith('/thread/')) {
      // Find reply button and click it
      const replyBtn = document.querySelector('[aria-label="Reply to Thread"]') as HTMLButtonElement;
      if (replyBtn) replyBtn.click();
    }
  };
  
  return (
    <header className="sticky top-0 z-40 bg-background border-b p-3 flex items-center justify-between h-14">
      <div className="flex items-center">
        {showBackButton() ? (
          <button 
            onClick={handleBack}
            className="mr-2 p-1 rounded-full hover:bg-muted/50"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
        ) : null}
        <h1 className="font-bold text-lg">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Connection indicator */}
        <div className="text-xs flex items-center">
          {connectedRelays > 0 ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500" />
          )}
          <span className="ml-1 hidden sm:inline">
            {connectedRelays} {connectedRelays === 1 ? 'relay' : 'relays'}
          </span>
        </div>
        
        {/* New thread/post button (only show on appropriate pages) */}
        {(location === '/' || location.startsWith('/board/') || location.startsWith('/thread/')) && (
          <button
            onClick={handleNewContent}
            className="p-2 rounded-full bg-primary text-primary-foreground"
            aria-label={location.startsWith('/thread/') ? 'Reply to Thread' : 'Create New Thread'}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;