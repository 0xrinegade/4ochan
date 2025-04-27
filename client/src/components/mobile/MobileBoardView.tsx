import React, { useState } from 'react';
import { Board, Thread } from '@/types';
import MobileThreadPreview from './MobileThreadPreview';
import { ChevronDown, Filter, RefreshCw } from 'lucide-react';

interface MobileBoardViewProps {
  board: Board;
  threads: Thread[];
  isLoading: boolean;
  onRefresh: () => void;
}

const MobileBoardView: React.FC<MobileBoardViewProps> = ({ 
  board, 
  threads, 
  isLoading, 
  onRefresh 
}) => {
  const [sortOption, setSortOption] = useState<'new' | 'active' | 'popular'>('active');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Sort threads based on selected option
  const sortedThreads = [...threads].sort((a, b) => {
    if (sortOption === 'new') {
      return b.createdAt - a.createdAt;
    } else if (sortOption === 'active') {
      const aLastActive = a.lastReplyTime || a.createdAt;
      const bLastActive = b.lastReplyTime || b.createdAt;
      return bLastActive - aLastActive;
    } else {
      // Popular - sort by reply count
      return (b.replyCount || 0) - (a.replyCount || 0);
    }
  });
  
  return (
    <div className="mobile-board-view">
      <div className="flex items-center justify-between p-3 bg-muted/30 sticky top-14 z-30">
        <div>
          <h2 className="text-sm font-semibold">/{board.shortName}/ - {board.name}</h2>
          <p className="text-xs text-foreground/60">{board.threadCount || 0} threads</p>
        </div>
        
        <div className="flex">
          <button 
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-muted/50 text-foreground/70"
            aria-label="Refresh"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="p-2 rounded-full hover:bg-muted/50 text-foreground/70 flex items-center"
            >
              <Filter size={16} className="mr-1" />
              <span className="text-xs">{sortOption}</span>
              <ChevronDown size={12} className="ml-1" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[120px]">
                <button 
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${sortOption === 'active' ? 'bg-muted/30 font-medium' : ''}`}
                  onClick={() => {
                    setSortOption('active');
                    setFilterOpen(false);
                  }}
                >
                  Active
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${sortOption === 'new' ? 'bg-muted/30 font-medium' : ''}`}
                  onClick={() => {
                    setSortOption('new');
                    setFilterOpen(false);
                  }}
                >
                  New
                </button>
                <button 
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${sortOption === 'popular' ? 'bg-muted/30 font-medium' : ''}`}
                  onClick={() => {
                    setSortOption('popular');
                    setFilterOpen(false);
                  }}
                >
                  Popular
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isLoading && threads.length === 0 ? (
        <div className="p-4 text-center">
          <div className="animate-pulse space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex">
                <div className="w-20 h-20 bg-muted rounded mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : threads.length === 0 ? (
        <div className="p-8 text-center text-foreground/60">
          <p>No threads yet.</p>
          <p className="text-sm mt-2">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sortedThreads.map(thread => (
            <MobileThreadPreview 
              key={thread.id} 
              thread={thread} 
              boardId={board.shortName || board.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileBoardView;