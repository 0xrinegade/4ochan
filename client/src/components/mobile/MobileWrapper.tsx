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
  
  // More options menu with glass morphism style
  const MoreOptionsMenu = () => (
    <div className="absolute top-full right-0 mt-2 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-lg z-50 border border-gray-100 dark:border-gray-800 min-w-[180px] animate-in fade-in zoom-in-95 duration-150 origin-top-right">
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
        <Share size={15} strokeWidth={1.75} className="mr-2 text-gray-600 dark:text-gray-300" />
        Share
      </button>
      
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => {
          setShowMoreOptions(false);
          // Copy the current URL to clipboard
          navigator.clipboard.writeText(window.location.href);
          alert('URL copied to clipboard');
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-600 dark:text-gray-300">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        Copy Link
      </button>
      
      <div className="my-1 border-t border-gray-200 dark:border-gray-800 opacity-40"></div>
      
      <button 
        className="w-full text-left px-3 py-2.5 text-sm rounded-md flex items-center text-rose-500 dark:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => {
          setShowMoreOptions(false);
          // Report action
          alert('Report function would be implemented here');
        }}
      >
        <Trash size={15} strokeWidth={1.75} className="mr-2" />
        Report
      </button>
    </div>
  );
  
  return (
    <div className="mobile-wrapper min-h-screen bg-white dark:bg-gray-950 pb-16">
      {/* Fixed header - Modern, minimal design */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-950/80 h-14 flex items-center justify-between px-4">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              className="mr-3 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={1.75} />
            </button>
          )}
          
          {isLoading ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <h1 className="font-medium text-base tracking-tight line-clamp-1">{title || '4ochan.org'}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch && (
            <button 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
          )}
          
          {rightAction !== 'none' && (
            <button 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors"
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
          
          {/* More options dropdown - Glass morphism style */}
          {showMoreOptions && <MoreOptionsMenu />}
        </div>
      </header>
      
      {/* Search overlay - Elegant with glass morphism */}
      {searchOpen && (
        <div className="fixed inset-0 bg-white/98 dark:bg-gray-950/98 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-150">
          <div className="p-3 flex items-center">
            <button 
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 mr-2 transition-colors"
              onClick={() => setSearchOpen(false)}
            >
              <X size={18} strokeWidth={1.75} />
            </button>
            
            <div className="flex-1 flex items-center bg-black/5 dark:bg-white/10 rounded-full px-3 py-1.5">
              <Search size={16} strokeWidth={1.75} className="text-gray-500 dark:text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoFocus
              />
              
              {searchQuery && (
                <button 
                  className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 px-4 pt-8">
            {/* Search results would go here */}
            {searchQuery ? (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 mb-2">
                  <Search size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">No results found</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Search functionality coming soon!</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 mb-2">
                  <Search size={20} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Search the platform</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Enter a search term above to find threads, posts, and users</p>
              </div>
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