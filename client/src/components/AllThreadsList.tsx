import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useNostr } from "@/hooks/useNostr";
import { formatDate, formatPubkey } from "@/lib/nostr";
import { Thread } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export const AllThreadsList: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const { pool, relays, getThread } = useNostr();
  
  // Load threads from localStorage
  useEffect(() => {
    // Attempt to load threads from localStorage first (for quick display)
    try {
      const allThreadIds: string[] = [];
      
      // Get thread IDs from localStorage
      const threadIdsStr = localStorage.getItem('created-thread-ids');
      if (threadIdsStr) {
        try {
          const threadIds = JSON.parse(threadIdsStr);
          allThreadIds.push(...threadIds);
        } catch (e) {
          console.error("Failed to parse thread IDs", e);
        }
      }
      
      // Get all boardIds that have threads
      const boardKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('thread-')) {
          boardKeys.push(key);
        }
      }
      
      // Extract threads from localStorage
      const storedThreads: Thread[] = [];
      boardKeys.forEach(key => {
        try {
          const boardThreadsStr = localStorage.getItem(key);
          if (boardThreadsStr) {
            const boardThreads = JSON.parse(boardThreadsStr);
            storedThreads.push(...boardThreads);
          }
        } catch (e) {
          console.error(`Failed to parse threads for ${key}`, e);
        }
      });
      
      // Sort threads by recency
      const sortedThreads = storedThreads.sort((a, b) => 
        (b.lastReplyTime || b.createdAt) - (a.lastReplyTime || a.createdAt)
      );
      
      setThreads(sortedThreads);
      
      // Fetch latest thread details in background
      fetchAllThreads();
    } catch (e) {
      console.error("Error loading threads from localStorage", e);
      fetchAllThreads();
    }
  }, []);
  
  // Fetch all threads from relays
  const fetchAllThreads = async () => {
    setLoading(true);
    
    try {
      if (!pool) {
        console.warn("No pool available to fetch threads");
        setLoading(false);
        return;
      }
      
      // Fetch all thread events (limit to past 30 days)
      const filter = {
        kinds: [9902], // Thread kind
        since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // Last 30 days
        limit: 100
      };
      
      const relayUrls = relays.filter(r => r.status === 'connected' && r.read).map(r => r.url);
      console.log(`Fetching all threads from ${relayUrls.length} relays...`);
      
      const events = await pool.querySync(relayUrls, filter);
      console.log(`Retrieved ${events.length} total thread events from relays for home page`);
      
      // Parse events into threads
      const newThreads: Thread[] = [];
      
      for (const event of events) {
        try {
          const thread = await getThread(event.id);
          if (thread) {
            newThreads.push(thread);
          }
        } catch (error) {
          console.error("Failed to parse thread event", event, error);
        }
      }
      
      // Sort by recency
      const sortedThreads = newThreads.sort((a, b) => 
        (b.lastReplyTime || b.createdAt) - (a.lastReplyTime || a.createdAt)
      );
      
      console.log(`Loaded ${sortedThreads.length} threads for home page`);
      setThreads(sortedThreads);
    } catch (error) {
      console.error("Error fetching all threads:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mb-8">
      <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center justify-between mb-2">
        <div>
          <span className="mr-1">■</span> RECENT THREADS
        </div>
        {loading && <span className="text-[10px] animate-pulse">Loading...</span>}
      </div>
      
      {threads.length > 0 ? (
        // Thread List
        threads.map(thread => (
          <Link href={`/thread/${thread.id}`} key={thread.id}>
            <div className="mb-4 bg-white border border-black cursor-pointer hover:border-primary">
              <div className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start">
                  {thread.images && thread.images.length > 0 && (
                    <div className="flex-shrink-0 mr-0 sm:mr-4 mb-2 sm:mb-0 w-full sm:w-auto">
                      <img 
                        src={thread.images[0]} 
                        alt="Thread attachment" 
                        className="post-image border border-black object-cover max-h-[200px] w-full sm:w-[150px] md:w-[200px]"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center mb-1">
                      <span className="font-bold text-primary">Anonymous</span>
                      <span className="ml-2 post-num">#{thread.id.substring(0, 6)}</span>
                      <span className="ml-2 timestamp text-xs">{formatDate(thread.createdAt)}</span>
                    </div>
                    <div className="text-sm mb-2 font-bold">{thread.title || "No Subject"}</div>
                    <div className="text-xs sm:text-sm mb-3 line-clamp-2">
                      {thread.content}
                    </div>
                    <div className="text-xs text-secondary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                      <div className="flex flex-wrap gap-2 sm:gap-0">
                        <span>
                          {thread.replyCount} replies
                        </span>
                        {thread.lastReplyTime && thread.lastReplyTime > thread.createdAt && (
                          <span className="sm:ml-4">
                            Last reply {formatDate(thread.lastReplyTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="hot-tag">
                          HOT
                        </span>
                        <div className="relative w-12 h-1.5 bg-gray-200 ml-1 overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-primary"
                            style={{ 
                              width: `${Math.min(100, Math.max(20, (thread.replyCount / 10) * 100))}%`,
                              animation: 'pulse 2s infinite' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))
      ) : loading ? (
        // Loading skeletons
        Array(3).fill(0).map((_, index) => (
          <div key={index} className="mb-4 bg-white border border-black">
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start">
                <Skeleton className="h-[150px] w-full sm:w-[150px] mr-0 sm:mr-4 mb-2 sm:mb-0" />
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12 ml-2" />
                    <Skeleton className="h-4 w-32 ml-2" />
                  </div>
                  <Skeleton className="h-5 w-full max-w-md mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="mb-4 bg-white border border-black">
          <div className="p-4 text-center">
            <p className="text-gray-700 mb-2 text-sm">No threads found</p>
            <p className="text-xs text-gray-500">Be the first to create a thread!</p>
          </div>
        </div>
      )}
    </div>
  );
};