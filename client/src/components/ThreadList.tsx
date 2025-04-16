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
  const { threads, loading, error, createThread } = useThreads(boardId);
  const [isCreateThreadModalOpen, setIsCreateThreadModalOpen] = useState(false);

  const handleCreateThread = async (
    title: string,
    content: string,
    imageUrls: string[]
  ) => {
    await createThread(title, content, imageUrls);
    setIsCreateThreadModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Board Header */}
        <div className="bg-white border-b border-gray-200 p-4 mb-4 rounded-t">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold flex items-center">
                  <span>/{boardShortName}/</span>
                  <span className="ml-2 text-sm font-normal text-gray-500">{boardName}</span>
                </h2>
                <p className="text-xs text-gray-600">{boardDescription}</p>
              </div>
              <Button 
                onClick={() => setIsCreateThreadModalOpen(true)}
                className="bg-accent hover:bg-red-700 text-white text-sm"
                size="sm"
              >
                <i className="fas fa-plus mr-1"></i> New Thread
              </Button>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-4 uppercase text-gray-600">Threads</h3>
          
          {loading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="thread-container mb-4">
                <div className="p-4">
                  <div className="flex items-start">
                    <Skeleton className="h-[250px] w-[250px] rounded mr-4" />
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
                      <div className="flex">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32 ml-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="thread-container mb-4 p-4">
              <div className="text-red-500">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Error loading threads: {error}
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-2"
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : threads.length === 0 ? (
            <div className="thread-container mb-4 p-8 text-center">
              <p className="text-gray-500 mb-4">No threads yet in this board</p>
              <Button 
                onClick={() => setIsCreateThreadModalOpen(true)}
                className="bg-accent hover:bg-red-700 text-white"
              >
                <i className="fas fa-plus mr-1"></i> Create the First Thread
              </Button>
            </div>
          ) : (
            // Thread List
            threads.map(thread => (
              <Link href={`/thread/${thread.id}`} key={thread.id}>
                <div className="thread-item thread-container mb-4 cursor-pointer">
                  <div className="p-4">
                    <div className="flex items-start">
                      {thread.images && thread.images.length > 0 && (
                        <div className="flex-shrink-0 mr-4">
                          <img 
                            src={thread.images[0]} 
                            alt="Thread attachment" 
                            className="post-image rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-bold text-primary">Anonymous</span>
                          <span className="ml-2 post-num">#{thread.id.substring(0, 6)}</span>
                          <span className="ml-2 timestamp">{formatDate(thread.createdAt)}</span>
                        </div>
                        <div className="text-sm mb-2 font-bold">{thread.title || "No Subject"}</div>
                        <div className="text-sm mb-3 line-clamp-2">
                          {thread.content}
                        </div>
                        <div className="text-xs text-secondary flex items-center justify-between">
                        <div>
                          <span>
                            <i className="fas fa-comment mr-1"></i> {thread.replyCount} replies
                          </span>
                          {thread.lastReplyTime && thread.lastReplyTime > thread.createdAt && (
                            <span className="ml-4">
                              <i className="fas fa-clock mr-1"></i> Last reply {formatDate(thread.lastReplyTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="bg-primary text-white text-xs px-1 py-0.5 rounded-sm">
                            HOT
                          </span>
                          <div className="relative w-16 h-2 bg-gray-200 ml-2 rounded-full overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
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
