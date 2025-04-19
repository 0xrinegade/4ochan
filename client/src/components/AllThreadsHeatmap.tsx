import React, { useEffect, useState } from 'react';
import { useNostr } from '@/context/NostrContext';
import { Thread } from '@/types';
import { ThreadPopularityHeatmap } from './ThreadPopularityHeatmap';
import { navigateWithoutReload } from '@/App';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Component that fetches all threads across boards and displays them in a popularity heatmap
 */
export const AllThreadsHeatmap: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const { pool, relays, getPostsByThread } = useNostr();
  
  // Load all threads for the heatmap
  useEffect(() => {
    const loadAllThreads = async () => {
      if (!pool) return;
      
      setLoading(true);
      
      try {
        // Get all connected relays that support reading
        const connectedRelays = relays
          .filter(r => r.status === 'connected' && r.read)
          .map(r => r.url);
        
        if (connectedRelays.length === 0) {
          console.warn('No connected relays available for reading');
          setLoading(false);
          return;
        }
        
        // Fetch threads from all boards, using a global scope to fetch multiple boards' threads
        console.log(`Fetching all threads for heatmap from ${connectedRelays.length} relays...`);
        
        // Import KIND from nostr.ts
        const { KIND } = await import('@/lib/nostr');
        
        // Use querySync with the proper kind from constants
        const allThreads = await pool.querySync(connectedRelays, {
          kinds: [KIND.THREAD], // Use the constant for thread kind (9902)
          limit: 50 // Limit to prevent too many threads in the heatmap
        });
        
        // Process the threads 
        const processedThreads: Thread[] = [];
        
        for (const event of allThreads) {
          try {
            // Skip events with invalid/empty content
            if (!event.content) {
              continue;
            }
            
            let threadData;
            try {
              threadData = JSON.parse(event.content);
            } catch (parseError) {
              console.warn(`Could not parse thread content for event ${event.id}`, parseError);
              continue; // Skip events with invalid JSON
            }
            
            // Ensure we have at least minimal required data
            if (!threadData || typeof threadData !== 'object') {
              continue;
            }
            
            // Extract board ID from tags if not in content
            let boardId = threadData.boardId || 'unknown';
            if (boardId === 'unknown') {
              // Try to find board tag
              const boardTag = event.tags.find((tag: string[]) => tag[0] === 'board');
              if (boardTag && boardTag.length > 1) {
                boardId = boardTag[1];
              }
            }
            
            // Create properly formatted thread object with safe defaults
            const thread: Thread = {
              id: event.id,
              boardId: boardId,
              title: threadData.title || 'Untitled Thread',
              content: threadData.content || '',
              authorPubkey: event.pubkey,
              createdAt: event.created_at || Math.floor(Date.now() / 1000),
              images: Array.isArray(threadData.images) ? threadData.images : [],
              media: Array.isArray(threadData.media) ? threadData.media : [],
              replyCount: 0, // We'll fetch this separately
              lastReplyTime: threadData.lastReplyTime || event.created_at || Math.floor(Date.now() / 1000)
            };
            
            processedThreads.push(thread);
          } catch (err) {
            console.error('Error processing thread for heatmap:', err);
          }
        }
        
        // Fetch reply counts for each thread
        console.log('Fetching reply counts for each thread...');
        // Use Promise.all to fetch replies for all threads in parallel
        try {
          // Limit to top 20 threads (by recency) first to improve performance
          const initialSortedThreads = [...processedThreads].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
          
          // Fetch replies in parallel
          await Promise.all(initialSortedThreads.map(async (thread) => {
            try {
              const replies = await getPostsByThread(thread.id);
              // Update the thread with reply count and last reply time
              thread.replyCount = replies.length;
              
              if (replies.length > 0) {
                // Find the most recent reply timestamp
                thread.lastReplyTime = Math.max(...replies.map(r => r.createdAt));
              }
            } catch (error) {
              console.error(`Error fetching replies for thread ${thread.id}:`, error);
            }
          }));
          
          // Re-sort threads after getting reply counts
          // Score based on 70% recency, 30% reply count
          const sortedThreads = initialSortedThreads.sort((a, b) => {
            const aLastReplyTime = a.lastReplyTime || a.createdAt;
            const bLastReplyTime = b.lastReplyTime || b.createdAt;
            const aScore = (aLastReplyTime * 0.7) + ((a.replyCount || 0) * 0.3);
            const bScore = (bLastReplyTime * 0.7) + ((b.replyCount || 0) * 0.3);
            return bScore - aScore;
          });
          
          // Set the threads state
          setThreads(sortedThreads);
          console.log(`Loaded ${sortedThreads.length} threads for heatmap visualization with reply counts`);
        } catch (replyError) {
          console.error('Error fetching reply counts:', replyError);
          // Fall back to just using the threads without reply counts
          const fallbackThreads = processedThreads.slice(0, 20);
          setThreads(fallbackThreads);
          console.log(`Loaded ${fallbackThreads.length} threads for heatmap visualization (without reply counts)`);
        }
      } catch (error) {
        console.error('Error fetching threads for heatmap:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllThreads();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadAllThreads, 60000);
    return () => clearInterval(interval);
  }, [pool, relays, getPostsByThread]);
  
  const handleThreadSelect = (threadId: string) => {
    // Navigate to the thread page
    navigateWithoutReload(`/thread/${threadId}`);
  };
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-4 gap-2">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-none border border-black" />
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Loading thread popularity data...</p>
        </div>
      </div>
    );
  }
  
  if (threads.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-500">No threads available for the heatmap visualization</p>
        <p className="text-xs text-gray-400 mt-1">Create new threads to see them appear here</p>
      </div>
    );
  }
  
  return (
    <ThreadPopularityHeatmap 
      threads={threads} 
      onThreadSelect={handleThreadSelect}
      className="p-2"
    />
  );
};

export default AllThreadsHeatmap;