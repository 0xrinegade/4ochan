import React, { useState } from "react";
import { Link } from "wouter";
import { useThreads } from "@/hooks/useThreads";
import { formatDate, formatPubkey } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { CreateThreadModal } from "@/components/CreateThreadModal";
import { Skeleton } from "@/components/ui/skeleton";

interface ThreadListProps {
  boardId: string;
  boardName?: string;
  boardShortName?: string;
  boardDescription?: string;
}

export const ThreadList: React.FC<ThreadListProps> = ({ 
  boardId, 
  boardName = "Board",
  boardShortName = "",
  boardDescription = ""
}) => {
  const { threads, loading, error, createThread, refreshThreads } = useThreads(boardId);
  const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    refreshThreads()
      .then(() => {
        console.log("Manually refreshed threads");
        setTimeout(() => setRefreshing(false), 500);
      })
      .catch(err => {
        console.error("Error refreshing threads:", err);
        setRefreshing(false);
      });
  };

  const handleCreateThread = async (
    title: string,
    content: string,
    imageUrls: string[]
  ) => {
    const newThread = await createThread(title, content, imageUrls);
    setIsCreateThreadModalOpen(false);
    
    // Navigate to the thread page
    console.log("Thread created successfully, navigating to thread:", newThread.id);
    setTimeout(() => {
      window.location.href = `/thread/${newThread.id}`;
    }, 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-background">
      <div className="container mx-auto">
        {/* Board Header */}
        <div className="bg-white border border-black mb-4">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold flex flex-wrap items-center">
                  <span>/{boardShortName}/</span>
                  <span className="ml-2 text-xs sm:text-sm font-normal text-gray-500">{boardName}</span>
                </h2>
                <p className="text-xs text-gray-600 mb-2 sm:mb-0">{boardDescription}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className={`bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs ${(loading || refreshing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  onClick={() => setIsCreateThreadModalOpen(true)}
                  className="bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Create Thread
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="mb-8">
          <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center mb-2">
            <span className="mr-1">■</span> THREADS
          </div>
          
          {loading ? (
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
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <Skeleton className="h-4 w-20 mb-1 sm:mb-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="mb-4 bg-white border border-black">
              <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                <span className="mr-1">■</span> ERROR
              </div>
              <div className="p-4">
                <div className="text-red-500 mb-2">
                  Error loading threads: {error}
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : threads.length === 0 ? (
            <div className="mb-4 bg-white border border-black">
              <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs">
                <span className="mr-1">■</span> EMPTY BOARD
              </div>
              <div className="p-4 text-center">
                <p className="text-gray-700 mb-4 text-sm">No threads yet in this board</p>
                <button 
                  onClick={() => setIsCreateThreadModalOpen(true)}
                  className="bg-gray-200 text-black font-bold py-0.5 px-2 border-2 border-black text-xs"
                  style={{ boxShadow: "2px 2px 0 #000" }}
                >
                  Create the First Thread
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Create Thread Modal */}
      <CreateThreadModal
        isOpen={isCreateThreadModalOpen}
        onClose={() => setIsCreateThreadModalOpen(false)}
        onCreateThread={handleCreateThread}
        boardShortName={boardShortName}
      />
    </div>
  );
};
