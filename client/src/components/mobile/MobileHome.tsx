import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useNostr } from '@/hooks/useNostr';
import { useBoards } from '@/hooks/useBoards';
import { navigateWithoutReload } from '@/App';
import { Board } from '@/types';
import {
  ArrowRight, Search, TrendingUp, Zap, Sparkles, 
  Bell, MessageSquare, Users, Compass, Bookmark,
  MessageCircle, Clock, Bolt, Activity, Plus,
  X, Menu
} from 'lucide-react';

const MobileHome: React.FC = () => {
  const { boards, loading: loadingBoards } = useBoards();
  const { connectedRelays, relays, identity } = useNostr();
  const [location, setLocation] = useLocation();
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'boards' | 'discover'>('trending');
  
  // For virtual scroll/lazy loading simulation
  const [visibleBoards, setVisibleBoards] = useState(6);
  
  // Function to format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Navigate to a board
  const navigateToBoard = (boardId: string) => {
    // Store last visited board for back navigation
    localStorage.setItem('lastVisitedBoard', boardId);
    navigateWithoutReload(`/board/${boardId}`);
  };
  
  // Load more boards on scroll
  const handleLoadMore = () => {
    if (visibleBoards < boards.length) {
      setVisibleBoards(prev => Math.min(prev + 6, boards.length));
    }
  };
  
  // Detect scroll near bottom to trigger lazy loading
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        handleLoadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleBoards, boards.length]);
  
  // Sort boards by activity/popularity
  const sortedBoards = [...boards].sort((a, b) => {
    return (b.threadCount || 0) - (a.threadCount || 0);
  });
  
  // Generate colors based on board name for visual variety
  const getBoardColor = (name: string): string => {
    const colors = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-indigo-400',
      'from-pink-500 to-rose-400',
      'from-green-500 to-emerald-400',
      'from-orange-500 to-amber-400',
      'from-red-500 to-rose-400',
      'from-indigo-500 to-blue-400',
      'from-teal-500 to-green-400'
    ];
    
    // Use name to pick a consistent color
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };
  
  return (
    <div className="mobile-home pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with status indicator and user info */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
        <div 
          className="flex items-center"
          onClick={() => setShowConnectionInfo(!showConnectionInfo)}
        >
          <div className={`w-2 h-2 rounded-full mr-1 ${connectedRelays > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{connectedRelays} {connectedRelays === 1 ? 'relay' : 'relays'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {identity?.profile?.name ? (
            <span className="text-sm font-medium">{identity.profile.name}</span>
          ) : (
            <span className="text-sm font-medium">Anonymous</span>
          )}
          <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white">
            {identity?.profile?.name?.substring(0, 1) || 'A'}
          </div>
        </div>
      </div>
      
      {/* Connection info (collapsible) */}
      {showConnectionInfo && (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-inner animate-fadeIn">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Connection Status</span>
            <button onClick={() => setShowConnectionInfo(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Total Relays:</span>
              <span>{relays.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Connected:</span>
              <span>{connectedRelays}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Boards:</span>
              <span>{formatNumber(boards.length)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar - Prominent and sticky */}
      <div className="sticky top-0 z-10 p-4 bg-white dark:bg-gray-800 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input 
            type="text"
            placeholder="Search threads and boards..."
            className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            onClick={() => {
              // For now, open search dialog
              const searchBtn = document.querySelector('[title="Search the page"]') as HTMLButtonElement;
              if (searchBtn) searchBtn.click();
            }}
            readOnly={true}
          />
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex bg-white dark:bg-gray-800 px-1 border-b border-gray-200 dark:border-gray-700 mb-3">
        <button 
          className={`flex-1 py-3 text-xs font-medium ${activeTab === 'trending' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('trending')}
        >
          Trending
        </button>
        <button 
          className={`flex-1 py-3 text-xs font-medium ${activeTab === 'boards' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('boards')}
        >
          Boards
        </button>
        <button 
          className={`flex-1 py-3 text-xs font-medium ${activeTab === 'discover' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="px-4">
        {activeTab === 'trending' && (
          <>
            {/* Trending Boards Section */}
            <section className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold flex items-center">
                  <TrendingUp size={16} className="mr-1 text-primary" />
                  Trending Boards
                </h2>
                <button 
                  className="text-xs text-primary flex items-center"
                  onClick={() => setActiveTab('boards')}
                >
                  See all <ArrowRight size={12} className="ml-1" />
                </button>
              </div>
              
              <div className="overflow-x-auto flex gap-3 pb-2 scrollbar-hide -mx-4 px-4">
                {loadingBoards ? (
                  // Loading skeleton
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="w-32 h-32 flex-shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))
                ) : (
                  sortedBoards.slice(0, 5).map((board) => (
                    <div 
                      key={board.id}
                      className={`w-32 h-32 flex-shrink-0 rounded-lg bg-gradient-to-br ${getBoardColor(board.shortName || board.id)} shadow-sm flex flex-col justify-between p-3 text-white relative overflow-hidden`}
                      onClick={() => navigateToBoard(board.shortName || board.id)}
                    >
                      <div className="absolute top-0 right-0 bg-black/20 rounded-bl-lg px-1.5 py-0.5 text-[10px]">
                        {board.threadCount || 0}
                      </div>
                      
                      <div className="font-bold drop-shadow-sm">/{board.shortName || board.id.substring(0, 4)}/</div>
                      <div className="mt-auto">
                        <div className="text-xs font-medium line-clamp-1 mb-1 opacity-90">{board.name}</div>
                        <div className="flex items-center text-[10px] space-x-1 opacity-80">
                          <Users size={10} />
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            
            {/* Quick Access Section */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3 flex items-center">
                <Zap size={16} className="mr-1 text-primary" />
                Quick Access
              </h2>
              
              <div className="grid grid-cols-4 gap-3">
                <QuickLinkButton 
                  icon={<MessageSquare size={18} />} 
                  label="All Threads" 
                  onClick={() => navigateWithoutReload('/board/all')}
                  bgClass="bg-blue-100 dark:bg-blue-900/30"
                  iconClass="text-blue-500"
                />
                <QuickLinkButton 
                  icon={<Bell size={18} />} 
                  label="My Feed" 
                  onClick={() => navigateWithoutReload('/subscriptions')}
                  bgClass="bg-purple-100 dark:bg-purple-900/30"
                  iconClass="text-purple-500"
                />
                <QuickLinkButton 
                  icon={<Clock size={18} />} 
                  label="Recent" 
                  onClick={() => navigateWithoutReload('/board/b')}
                  bgClass="bg-green-100 dark:bg-green-900/30"
                  iconClass="text-green-500"
                />
                <QuickLinkButton 
                  icon={<Bookmark size={18} />} 
                  label="Saved" 
                  onClick={() => navigateWithoutReload('/subscriptions')}
                  bgClass="bg-amber-100 dark:bg-amber-900/30"
                  iconClass="text-amber-500"
                />
              </div>
            </section>
            
            {/* Recent Activity Section */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3 flex items-center">
                <Activity size={16} className="mr-1 text-primary" />
                Latest Activity
              </h2>
              
              <div className="space-y-2">
                {loadingBoards ? (
                  // Loading skeleton
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))
                ) : (
                  sortedBoards.slice(0, 3).map((board) => (
                    <div 
                      key={board.id}
                      className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center"
                      onClick={() => navigateToBoard(board.shortName || board.id)}
                    >
                      <div className={`w-10 h-10 rounded bg-gradient-to-br ${getBoardColor(board.shortName || board.id)} flex items-center justify-center text-white font-bold`}>
                        {board.shortName?.substring(0, 1) || board.id.substring(0, 1)}
                      </div>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="font-medium">/{board.shortName || board.id}/</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{board.name}</div>
                      </div>
                      
                      <div className="ml-2 flex items-center text-xs">
                        <MessageCircle size={12} className="text-gray-400 mr-1" />
                        <span>{board.threadCount || 0}</span>
                      </div>
                    </div>
                  ))
                )}
                
                <button 
                  className="w-full p-2.5 text-center text-xs font-medium text-primary border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  onClick={() => setActiveTab('boards')}
                >
                  View all boards
                </button>
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'boards' && (
          <>
            {/* All Boards Grid */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3">All Boards</h2>
              
              <div className="grid grid-cols-2 gap-3">
                {loadingBoards ? (
                  // Loading skeleton
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))
                ) : boards.length === 0 ? (
                  <div className="col-span-2 p-6 text-center text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                    No boards available
                  </div>
                ) : (
                  // Display boards with virtual scroll
                  sortedBoards.slice(0, visibleBoards).map((board) => (
                    <ModernBoardCard
                      key={board.id}
                      board={board}
                      colorClass={getBoardColor(board.shortName || board.id)}
                      onClick={() => navigateToBoard(board.shortName || board.id)}
                    />
                  ))
                )}
              </div>
              
              {visibleBoards < boards.length && (
                <button 
                  className="w-full mt-3 p-2.5 text-center text-xs font-medium text-primary border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  onClick={handleLoadMore}
                >
                  Load more
                </button>
              )}
            </section>
          </>
        )}
        
        {activeTab === 'discover' && (
          <>
            {/* Featured Content */}
            <section className="mb-6">
              <h2 className="text-base font-semibold mb-3 flex items-center">
                <Sparkles size={16} className="mr-1 text-primary" />
                Featured Boards
              </h2>
              
              <div className="space-y-3">
                {/* Featured board with large card */}
                {sortedBoards.length > 0 && (
                  <div 
                    className={`w-full h-48 rounded-lg bg-gradient-to-br ${getBoardColor(sortedBoards[0]?.shortName || 'main')} shadow-sm flex flex-col justify-end p-4 text-white relative overflow-hidden`}
                    onClick={() => sortedBoards[0] && navigateToBoard(sortedBoards[0].shortName || sortedBoards[0].id)}
                  >
                    <div className="absolute top-3 right-3 bg-white/20 rounded-full px-2 py-0.5 text-xs backdrop-blur-sm">
                      Featured
                    </div>
                    
                    <div className="font-bold text-xl drop-shadow-sm">/{sortedBoards[0]?.shortName || 'main'}/</div>
                    <div className="text-sm opacity-90 mb-1">{sortedBoards[0]?.name || 'Main Board'}</div>
                    <div className="flex items-center text-xs space-x-2 opacity-80">
                      <div className="flex items-center">
                        <MessageCircle size={12} className="mr-1" />
                        <span>{sortedBoards[0]?.threadCount || 0} threads</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={12} className="mr-1" />
                        <span>Active users</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Category exploration */}
                <div className="grid grid-cols-2 gap-3">
                  <CategoryCard 
                    name="Technology" 
                    icon={<Bolt size={16} />}
                    onClick={() => navigateWithoutReload('/board/tech')} 
                  />
                  <CategoryCard 
                    name="Random" 
                    icon={<Compass size={16} />}
                    onClick={() => navigateWithoutReload('/board/b')} 
                  />
                  <CategoryCard 
                    name="Artificial Intelligence" 
                    icon={<Zap size={16} />}
                    onClick={() => navigateWithoutReload('/board/ai')} 
                  />
                  <CategoryCard 
                    name="Meta Discussion" 
                    icon={<Menu size={16} />}
                    onClick={() => navigateWithoutReload('/board/meta')} 
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      
      {/* Create thread floating button */}
      <button 
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
        onClick={() => {
          const createThreadBtn = document.querySelector('[aria-label="Create New Thread"]') as HTMLButtonElement;
          if (createThreadBtn) createThreadBtn.click();
        }}
      >
        <Plus size={24} />
      </button>
      
      {/* App Info - Minimized */}
      <div className="py-2 text-center text-xs text-gray-400 dark:text-gray-500 mt-3 mb-14">
        <p>4ochan.org • v1.0.0</p>
      </div>
    </div>
  );
};

interface ModernBoardCardProps {
  board: Board;
  colorClass: string;
  onClick: () => void;
}

const ModernBoardCard: React.FC<ModernBoardCardProps> = ({ board, colorClass, onClick }) => {
  return (
    <div 
      className="h-32 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col p-3 relative transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      {/* Color accent */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colorClass}`}></div>
      
      <div className="font-bold">/
        <span className="text-primary">{board.shortName || board.id.substring(0, 4)}</span>/
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{board.name}</div>
      
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <MessageCircle size={12} className="mr-1" />
          <span>{board.threadCount || 0}</span>
        </div>
        <ArrowRight size={14} className="text-primary" />
      </div>
    </div>
  );
};

interface QuickLinkButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  bgClass: string;
  iconClass: string;
}

const QuickLinkButton: React.FC<QuickLinkButtonProps> = ({ 
  icon, 
  label, 
  onClick,
  bgClass,
  iconClass
}) => {
  return (
    <button 
      className={`flex flex-col items-center p-3 rounded-lg ${bgClass} transition-transform active:scale-95`}
      onClick={onClick}
    >
      <div className={`${iconClass} mb-1`}>{icon}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
};

interface CategoryCardProps {
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, icon, onClick }) => {
  return (
    <button 
      className="h-24 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-3 transition-transform active:scale-95"
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-primary mb-2">
        {icon}
      </div>
      <div className="text-xs font-medium">{name}</div>
    </button>
  );
};

export default MobileHome;