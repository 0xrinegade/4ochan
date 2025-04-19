import React, { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadList } from "@/components/ThreadList";
import { AllThreadsList } from "@/components/AllThreadsList";
import { useNostr } from "@/hooks/useNostr";
import { useBoards } from "@/hooks/useBoards";
import { CreateThreadModal } from "@/components/CreateThreadModal";
import { formatPubkey, KIND } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { navigateWithoutReload } from "@/App";
import { Thread } from "@/types";
import { ThreadPopularityHeatmap } from "@/components/ThreadPopularityHeatmap";
import { AllThreadsHeatmap } from "@/components/AllThreadsHeatmap";
import { ConnectionStatus } from "@/components/ConnectionStatus";

// Interface for user replies
interface UserReply {
  id: string;
  threadId: string;
  content: string;
  createdAt: number;
}

const Home: React.FC<{ id?: string }> = ({ id }) => {
  // If id is not passed as a prop, try to get it from the URL params
  const params = useParams<{ id?: string }>();
  const boardId = id || params.id;
  
  const { boards: nostrBoards, loading: loadingBoards } = useBoards();
  const nostr = useNostr();
  const { connect, connectedRelays, relays, identity, getTotalViewCount } = nostr;
  const [connecting, setConnecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  
  // State for total view count
  const [totalViews, setTotalViews] = useState<number>(0);
  
  // State for user activity
  const [userCreatedThreads, setUserCreatedThreads] = useState<Thread[]>([]);
  const [userReplies, setUserReplies] = useState<UserReply[]>([]);
  const [newRepliesCount, setNewRepliesCount] = useState(0);
  const [lastVisitTime, setLastVisitTime] = useState<number>(0);

  // Find the current board details - either by ID or shortName
  const currentBoard = boardId
    ? nostrBoards.find(board => board.id === boardId || board.shortName === boardId)
    : nostrBoards.length > 0
      ? nostrBoards[0]
      : undefined;

  // Connect to relays if not connected
  useEffect(() => {
    if (connectedRelays === 0 && !connecting) {
      setConnecting(true);
      connect().finally(() => setConnecting(false));
    }
  }, [connectedRelays, connect]);
  
  // Load total view count
  useEffect(() => {
    if (connectedRelays > 0 && getTotalViewCount) {
      const fetchTotalViews = async () => {
        try {
          const count = await getTotalViewCount();
          setTotalViews(count);
        } catch (error) {
          console.error("Error fetching total view count:", error);
        }
      };
      
      fetchTotalViews();
      
      // Refresh view count every 5 minutes
      const interval = setInterval(fetchTotalViews, 300000);
      
      return () => clearInterval(interval);
    }
  }, [connectedRelays, getTotalViewCount]);
  
  // Load user activity data
  useEffect(() => {
    // If not connected to Nostr, don't try to fetch
    if (!identity?.pubkey || !nostr) return;
    
    const fetchUserActivity = async () => {
      try {
        // Load last visit time from localStorage
        const lastVisitData = localStorage.getItem('last-visit-time');
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (lastVisitData) {
          setLastVisitTime(parseInt(lastVisitData, 10));
        }
        
        // Save current visit time
        localStorage.setItem('last-visit-time', currentTime.toString());
        
        // Don't proceed if we don't have the required connections
        if (!nostr.pool || connectedRelays <= 0) {
          console.log("No pool available to fetch user activity");
          return;
        }
        
        // Get relay URLs that are actually connected for reading
        const relayUrls = relays
          .filter(r => r.status === 'connected' && r.read)
          .map(r => r.url);
          
        if (relayUrls.length === 0) {
          console.log("No connected read relays available");
          return;
        }
        
        // First fetch threads
        try {
          // Get all threads created by this user - use the KIND constant imported from the nostr.ts file
          const filter = {
            kinds: [KIND.THREAD],
            authors: [identity.pubkey],
            limit: 10
          };
          
          // Get thread events from all connected relays
          const events = await nostr.pool.querySync(relayUrls, filter);
          
          // Parse thread events into Thread objects
          const threads: Thread[] = [];
          
          for (const event of events) {
            try {
              const threadData = JSON.parse(event.content);
              
              const thread: Thread = {
                id: event.id,
                boardId: threadData.boardId || 'unknown',
                title: threadData.title || 'Untitled',
                content: threadData.content,
                images: threadData.images || [],
                authorPubkey: event.pubkey,
                createdAt: event.created_at,
                replyCount: 0,
                lastReplyTime: event.created_at
              };
              
              threads.push(thread);
            } catch (parseError) {
              console.error("Failed to parse user thread event", parseError);
            }
          }
          
          // Sort by creation time (newest first)
          const sortedThreads = threads.sort((a, b) => b.createdAt - a.createdAt);
          setUserCreatedThreads(sortedThreads);
        } catch (threadError) {
          console.error("Error fetching user threads:", threadError);
        }
        
        // Then fetch replies in a separate try/catch block
        try {
          // Fetch user's replies
          const replyFilter = {
            kinds: [KIND.POST],
            authors: [identity.pubkey],
            limit: 20
          };
          
          const replyEvents = await nostr.pool.querySync(relayUrls, replyFilter);
          
          // Parse reply events
          const replies: UserReply[] = [];
          let newRepliesCounter = 0;
          
          for (const event of replyEvents) {
            try {
              // Find thread ID from tags
              const threadTag = event.tags.find((tag: string[]) => tag[0] === 'e');
              if (threadTag && threadTag[1]) {
                const threadId = threadTag[1];
                
                const reply: UserReply = {
                  id: event.id,
                  threadId,
                  content: event.content,
                  createdAt: event.created_at
                };
                
                replies.push(reply);
                
                // Count new replies since last visit
                if (lastVisitData && event.created_at > parseInt(lastVisitData, 10) && event.pubkey !== identity.pubkey) {
                  newRepliesCounter++;
                }
              }
            } catch (parseError) {
              console.error("Failed to parse user reply event", parseError);
            }
          }
          
          // Sort by creation time (newest first)
          const sortedReplies = replies.sort((a, b) => b.createdAt - a.createdAt);
          setUserReplies(sortedReplies);
          setNewRepliesCount(newRepliesCounter);
        } catch (replyError) {
          console.error("Error fetching user replies:", replyError);
        }
        
      } catch (error) {
        console.error("Error in user activity process:", error);
      }
    };
    
    // Initial fetch
    fetchUserActivity();
    
    // Set up an interval to check for new activity every minute, but only if we're connected
    // We'll use a shorter interval (15 seconds) for the first check to make sure data appears quickly
    const quickCheckId = setTimeout(() => {
      if (connectedRelays > 0) fetchUserActivity();
    }, 15000);
    
    // Then set up the regular interval
    const intervalId = setInterval(() => {
      if (connectedRelays > 0) fetchUserActivity();
    }, 60000);
    
    return () => {
      clearTimeout(quickCheckId);
      clearInterval(intervalId);
    };
  }, [identity?.pubkey, connectedRelays]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="container mx-auto px-2 sm:px-4">
          <ConnectionStatus />
          <div className="flex flex-col md:flex-row gap-2">
            <div className="w-full md:w-1/4">
              <div className="mb-2">
                <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center">
                  <span className="mr-1">■</span> RECENT ACTIVITY
                </div>
                <div className="bg-white border border-black border-t-0 p-2">
                  <div className="mb-2">
                    <div className="text-xs font-bold mb-1">Your Threads:</div>
                    {identity?.pubkey ? (
                      <>
                        {userCreatedThreads.length > 0 ? (
                          <ul className="text-xs md:list-disc md:pl-4">
                            {userCreatedThreads.slice(0, 3).map(thread => (
                              <li key={thread.id} className="mb-0.5 truncate">
                                <a 
                                  href={`/thread/${thread.id}`} 
                                  className="text-primary underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithoutReload(`/thread/${thread.id}`);
                                  }}
                                >
                                  {thread.title || "Untitled Thread"}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">No threads created yet</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Not connected</p>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-xs font-bold mb-1">Recent Replies:</div>
                    {identity?.pubkey ? (
                      <>
                        {userReplies.length > 0 ? (
                          <ul className="text-xs md:list-disc md:pl-4">
                            {userReplies.slice(0, 3).map(reply => (
                              <li key={reply.id} className="mb-0.5 truncate">
                                <a 
                                  href={`/thread/${reply.threadId}`} 
                                  className="text-primary underline"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithoutReload(`/thread/${reply.threadId}`);
                                  }}
                                >
                                  {reply.content.substring(0, 30)}...
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">No replies yet</p>
                        )}
                        
                        {newRepliesCount > 0 && (
                          <div className="mt-2 bg-yellow-100 border border-yellow-300 p-1 text-xs">
                            <span className="font-bold">{newRepliesCount}</span> new {newRepliesCount === 1 ? 'reply' : 'replies'} since your last visit
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Not connected</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="w-full md:w-3/4">
              {/* When a specific board is selected */}
              {boardId ? (
                <ThreadList 
                  boardId={boardId}
                  boardName={currentBoard?.name || "Board"}
                  boardShortName={currentBoard?.shortName || boardId.substring(0, 4)}
                  boardDescription={currentBoard?.description || ""}
                />
              ) : (
                <>
                  {/* Welcome Banner */}
                  <div className="mb-4">
                    <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                      <span className="mr-1">■</span> WELCOME TO 4OCHAN.ORG
                    </div>
                    <div className="bg-white border border-black border-t-0 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">A decentralized imageboard built on Nostr.</p>
                          <div className="mt-2 flex gap-2">
                            <button 
                              onClick={() => setShowCreateModal(true)}
                              className="bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs"
                              style={{ boxShadow: "2px 2px 0 #000" }}
                            >
                              Create New Thread
                            </button>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <img 
                            src="/under-construction.gif" 
                            alt="Under Construction" 
                            width={120}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Site Statistics */}
                  <div className="mb-4">
                    <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                      <span className="mr-1">■</span> SITE STATISTICS
                    </div>
                    <div className="bg-white border border-black border-t-0 p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="font-bold">Relays:</span> {relays.length}
                        </div>
                        <div>
                          <span className="font-bold">Connected:</span> {connectedRelays}
                        </div>
                        <div>
                          <span className="font-bold">Boards:</span> {nostrBoards.length}
                        </div>
                        <div>
                          <span className="font-bold">Thread Views:</span> {totalViews.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-bold">Version:</span> 0.1.0
                        </div>
                        <div>
                          <span className="font-bold">Powered by:</span> Nostr
                        </div>
                        <div className="col-span-2 sm:col-span-3 text-xs text-gray-700 mt-1">
                          <span className="font-bold">Created:</span> {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thread Popularity Heatmap */}
                  <div className="mb-4">
                    <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                      <span className="mr-1">■</span> THREAD POPULARITY HEATMAP
                    </div>
                    <div className="bg-white border border-black border-t-0">
                      {/* Pass all threads to the heatmap component */}
                      <AllThreadsHeatmap />
                    </div>
                  </div>

                  {/* All Recent Threads */}
                  <AllThreadsList />
                </>
              )}
            </div>
          </div>


          {/* Footer - classic 90s */}
          <div className="mt-4 text-center text-xs">
            <div className="border-t border-black pt-1">
              <p className="flex items-center justify-center flex-wrap gap-x-1 gap-y-2">
                <span className="text-primary">◆</span> 
                <span>4ochan.org © 2025</span> 
                <span className="text-primary">◆</span> 
                <a 
                  href="#" 
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // navigateWithoutReload(`/about`);
                  }}
                >About</a> 
                <span className="text-primary">◆</span> 
                <a 
                  href="#" 
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // navigateWithoutReload(`/terms`);
                  }}
                >Terms</a> 
                <span className="text-primary">◆</span> 
                <a 
                  href="#" 
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // navigateWithoutReload(`/privacy`);
                  }}
                >Privacy</a>
                <span className="text-primary">◆</span>
                <a 
                  href="/design" 
                  className="text-primary underline"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateWithoutReload(`/design`);
                  }}
                >Design</a>
                <span className="text-primary">◆</span>
              </p>
              <p className="text-[10px] mt-1.5 italic">Best viewed with Netscape Navigator</p>
              
              {/* Visitor counter moved from header */}
              <div className="my-1.5 flex flex-wrap gap-2 justify-center">
                <span className="bg-white border border-black inline-block px-2 py-0.5 text-[10px]">
                  Relays: {relays.length} | Connected: {connectedRelays} | Boards: {nostrBoards.length}
                </span>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white font-bold py-0.5 px-2 border border-black text-[10px] hover:bg-[#6b0000]"
                >
                  CREATE NEW THREAD
                </button>
              </div>
              
              {/* Classic 90s web badges */}
              <div className="flex flex-wrap items-center justify-center mt-1.5 gap-1">
                <div className="border border-black bg-gray-200 px-1 text-[8px] font-mono">HTML 1.0</div>
                <div className="border border-black bg-gray-200 px-1 text-[8px] font-mono">800x600</div>
                <div className="border border-black bg-blue-700 text-white px-1 text-[8px] animate-pulse font-mono">JAVASCRIPT ON</div>
                <div className="border border-gray-500 bg-white text-[8px] font-mono px-1 italic">
                  <span className="text-red-600 font-bold">W</span>
                  <span className="text-blue-600 font-bold">e</span>
                  <span className="text-green-600 font-bold">b</span>
                  <span className="text-yellow-600 font-bold">1.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* For functionality and access to modals */}
          <div className="hidden">
            <BoardSidebar />
          </div>
          
          {/* Create Thread Modal */}
          {showCreateModal && (
            <CreateThreadModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreateThread={async (title, content, imageUrls) => {
                try {
                  // Find the current board if needed
                  let targetBoardId = currentBoard?.id;
                  if (!targetBoardId && nostrBoards.length > 0) {
                    targetBoardId = nostrBoards[0].id;
                  }
                  
                  if (!targetBoardId) {
                    toast({
                      title: "Error",
                      description: "No board selected or available",
                      variant: "destructive",
                    });
                    return Promise.reject("No board selected");
                  }
                  
                  // Use the Nostr context to create the thread
                  const thread = await nostr.createThread(
                    targetBoardId,
                    title,
                    content,
                    imageUrls
                  );
                  
                  toast({
                    title: "Thread Created",
                    description: "Your thread has been posted successfully",
                  });
                  
                  setShowCreateModal(false);
                  
                  // Navigate directly to the thread page using client-side navigation
                  console.log("Thread created successfully, navigating to thread:", thread.id);
                  setTimeout(() => {
                    // Use client-side navigation to avoid page reload
                    navigateWithoutReload(`/thread/${thread.id}`);
                  }, 1000);
                  
                  return Promise.resolve();
                } catch (error: any) {
                  console.error("Error creating thread:", error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to create thread",
                    variant: "destructive",
                  });
                  return Promise.reject(error);
                }
              }}
              boardShortName={currentBoard?.shortName || boardId || ""}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;