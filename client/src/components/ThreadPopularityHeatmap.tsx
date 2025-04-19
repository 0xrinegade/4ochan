import React, { useState, useEffect } from 'react';
import { Thread } from '../types';
import { useNostr } from '../context/NostrContext';
import { cn } from '../lib/utils';
import { timeAgo } from '../lib/nostr';

interface ThreadPopularityHeatmapProps {
  threads: Thread[];
  onThreadSelect: (threadId: string) => void;
  className?: string;
}

interface HeatmapCell {
  thread: Thread;
  heat: number;  // 0-100 value representing activity level
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ThreadPopularityHeatmap: React.FC<ThreadPopularityHeatmapProps> = ({
  threads,
  onThreadSelect,
  className
}) => {
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const { getThreadStats } = useNostr();
  
  useEffect(() => {
    // Calculate heat levels based on thread activity
    const calculateHeat = async () => {
      if (!threads || threads.length === 0) return;
      
      const cells: HeatmapCell[] = [];
      const now = Math.floor(Date.now() / 1000);
      const MAX_AGE = 60 * 60 * 24 * 7; // One week in seconds
      
      for (const thread of threads) {
        // Get reply count for the thread with safeguard for null/undefined
        const replyCount = thread.replyCount || 0;
        
        // Calculate time factor (newer = hotter)
        const age = now - thread.createdAt;
        const ageFactor = Math.max(0, 1 - (age / MAX_AGE));
        
        // Calculate view count factor
        const viewStats = await getThreadStats(thread.id);
        const viewCount = viewStats?.viewCount || 0;
        const viewFactor = Math.min(1, viewCount / 100); // Cap at 100 views
        
        // Calculate heat based on replies, recency, and views
        const replyHeat = Math.min(50, replyCount * 5); // Up to 50 points from replies
        const timeHeat = ageFactor * 30; // Up to 30 points from recency
        const viewHeat = viewFactor * 20; // Up to 20 points from views
        
        const totalHeat = replyHeat + timeHeat + viewHeat;
        
        // Determine size based on heat
        let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        if (totalHeat < 20) size = 'xs';
        else if (totalHeat < 40) size = 'sm';
        else if (totalHeat < 60) size = 'md';
        else if (totalHeat < 80) size = 'lg';
        else size = 'xl';
        
        cells.push({
          thread,
          heat: totalHeat,
          size
        });
      }
      
      // Sort by heat (hottest first)
      cells.sort((a, b) => b.heat - a.heat);
      
      setHeatmapCells(cells);
    };
    
    calculateHeat();
    
    // Re-calculate every minute to update time factors
    const interval = setInterval(calculateHeat, 60000);
    return () => clearInterval(interval);
  }, [threads, getThreadStats]);
  
  // Get heat color based on value (0-100)
  const getHeatColor = (heat: number): string => {
    if (heat < 20) return 'bg-blue-100 dark:bg-blue-950';
    if (heat < 40) return 'bg-green-100 dark:bg-green-900';
    if (heat < 60) return 'bg-yellow-100 dark:bg-yellow-900';
    if (heat < 80) return 'bg-orange-100 dark:bg-orange-900';
    return 'bg-red-100 dark:bg-red-900';
  };
  
  // Get cell size class
  const getCellSizeClass = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string => {
    switch (size) {
      case 'xs': return 'w-16 h-16';
      case 'sm': return 'w-20 h-20';
      case 'md': return 'w-24 h-24';
      case 'lg': return 'w-28 h-28';
      case 'xl': return 'w-32 h-32';
    }
  };
  
  if (heatmapCells.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <p className="text-center text-gray-500 p-8 border border-dashed border-gray-300">
          No threads available for heatmap visualization
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("p-4", className)}>
      <h3 className="text-xl mb-4 font-bold text-center">Thread Popularity Heatmap</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {heatmapCells.map((cell) => (
          <div 
            key={cell.thread.id}
            className={cn(
              "relative cursor-pointer border border-black overflow-hidden",
              "transition-transform hover:scale-105 hover:z-10",
              getCellSizeClass(cell.size),
              getHeatColor(cell.heat)
            )}
            onClick={() => onThreadSelect(cell.thread.id)}
            title={`${cell.thread.title} - ${cell.thread.replyCount || 0} ${(cell.thread.replyCount === 1) ? 'reply' : 'replies'} - ${timeAgo(cell.thread.createdAt)}`}
          >
            <div className="absolute inset-0 p-1 flex flex-col text-xs">
              <div className="font-bold truncate">
                {cell.thread.title}
              </div>
              <div className="text-[8px] mt-auto font-bold">
                {cell.thread.replyCount || 0} {(cell.thread.replyCount === 1) ? 'reply' : 'replies'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <span className="w-3 h-3 inline-block bg-blue-100 dark:bg-blue-950 border border-black mr-1"></span>
            Cold
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 inline-block bg-green-100 dark:bg-green-900 border border-black mr-1"></span>
            Cool
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 inline-block bg-yellow-100 dark:bg-yellow-900 border border-black mr-1"></span>
            Warm
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 inline-block bg-orange-100 dark:bg-orange-900 border border-black mr-1"></span>
            Hot
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 inline-block bg-red-100 dark:bg-red-900 border border-black mr-1"></span>
            Very Hot
          </span>
        </div>
      </div>
    </div>
  );
};