import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import MobileNavigation from './MobileNavigation';
import { ArrowLeft, X, Search, Share, Trash, MoreVertical, Info } from 'lucide-react';
import { navigateWithoutReload } from '@/App';
import { Skeleton } from '@/components/ui/skeleton';

interface MobileWrapperProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  isLoading?: boolean;
  hideNavigation?: boolean;
  onRefresh?: () => void;
  rightAction?: 'share' | 'more' | 'info' | 'none';
  onRightActionClick?: () => void;
}

/**
 * Wrapper component for mobile views that provides consistent header and navigation
 */
const MobileWrapper: React.FC<MobileWrapperProps> = ({
  children,
  title,
  showBackButton = true,
  showSearch = false,
  isLoading = false,
  hideNavigation = false,
  onRefresh,
  rightAction = 'none',
  onRightActionClick,
}) => {
  const [location, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    // Check if we have a previous board to go back to
    const lastBoard = localStorage.getItem('lastVisitedBoard');
    
    if (location.startsWith('/thread/') && lastBoard) {
      // Go back to the board the user was on
      navigateWithoutReload(`/board/${lastBoard}`);
    } else {
      // Default to home
      navigateWithoutReload('/');
    }
  };
  
  // Right action icon
  const getRightActionIcon = () => {
    switch(rightAction) {
      case 'share':
        return <Share size={20} />;
      case 'more':
        return <MoreVertical size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return null;
    }
  };
  
  // More options menu
  const MoreOptionsMenu = () => (
    <div className="absolute top-full right-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700 min-w-[180px]">
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => {
          setShowMoreOptions(false);
          // Handle share action
          if (navigator.share) {
            navigator.share({
              title: title || '4ochan.org',
              url: window.location.href,
            });
          }
        }}
      >
        <Share size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
        Share
      </button>
      
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => {
          setShowMoreOptions(false);
          // Copy the current URL to clipboard
          navigator.clipboard.writeText(window.location.href);
          alert('URL copied to clipboard');
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-500 dark:text-gray-400">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        Copy Link
      </button>
      
      <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
      
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => {
          setShowMoreOptions(false);
          // Report action
          alert('Report function would be implemented here');
        }}
      >
        <Trash size={16} className="mr-2" />
        Report
      </button>
    </div>
  );
  
  return (
    <div className="mobile-wrapper min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Fixed header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              className="mr-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <h1 className="font-medium text-lg line-clamp-1">{title || '4ochan.org'}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {showSearch && (
            <button 
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          )}
          
          {rightAction !== 'none' && (
            <button 
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={() => {
                if (rightAction === 'more') {
                  setShowMoreOptions(!showMoreOptions);
                } else if (onRightActionClick) {
                  onRightActionClick();
                }
              }}
              aria-label={rightAction}
            >
              {getRightActionIcon()}
            </button>
          )}
          
          {/* More options dropdown */}
          {showMoreOptions && <MoreOptionsMenu />}
        </div>
      </header>
      
      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
            <button 
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2"
              onClick={() => setSearchOpen(false)}
            >
              <X size={20} />
            </button>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
              autoFocus
            />
            
            {searchQuery && (
              <button 
                className="p-1.5 text-gray-500 dark:text-gray-400"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <div className="flex-1 p-4">
            {/* Search results would go here */}
            {searchQuery ? (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                Search functionality coming soon!
              </p>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                Enter a search term above
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main>
        {children}
      </main>
      
      {/* Bottom navigation */}
      {!hideNavigation && <MobileNavigation />}
    </div>
  );
};

export default MobileWrapper;