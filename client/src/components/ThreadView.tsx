import React, { useState } from "react";
import { Link } from "wouter";
import { useThread } from "@/hooks/useThreads";
import { formatDate, formatPubkey } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { PostReplyForm } from "@/components/PostReplyForm";
import { MediaGallery } from "@/components/MediaDisplay";
import { MediaContent } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ThreadViewProps {
  threadId: string;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId }) => {
  const { thread, posts, loading, error, refreshThread, createPost } = useThread(threadId);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // Handle post being referenced for reply
  const handleQuotePost = (postId: string) => {
    setSelectedPostId(postId);
    
    // Scroll to reply form
    document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmitReply = async (
    content: string, 
    imageUrls: string[] = [], 
    media?: MediaContent[]
  ) => {
    const replyToIds = selectedPostId ? [threadId, selectedPostId] : [threadId];
    
    // For backward compatibility, extract URLs from media objects if provided
    const allImageUrls = [...imageUrls];
    if (media && media.length > 0) {
      // Add any image URLs from the media objects
      const mediaUrls = media
        .filter(m => m.type === 'image')
        .map(m => m.url);
      allImageUrls.push(...mediaUrls);
    }
    
    await createPost(content, replyToIds, allImageUrls, media);
    setSelectedPostId(null);
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <Link href={thread ? `/board/${thread.boardId}` : "/"}>
            <Button variant="ghost" className="text-sm text-primary flex items-center">
              <i className="fas fa-arrow-left mr-1"></i> Back to threads
            </Button>
          </Link>
          <Button 
            onClick={() => refreshThread()} 
            variant="ghost" 
            className="text-sm text-accent"
            disabled={loading}
          >
            <i className={`fas fa-sync-alt mr-1 ${loading ? "animate-spin" : ""}`}></i> Refresh
          </Button>
        </div>
        
        {/* Thread Container */}
        <div className="thread-container overflow-hidden">
          {loading && !thread ? (
            // Loading skeleton for thread
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
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4 mb-1" />
                </div>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Error loading thread: {error}
              </div>
              <Button 
                onClick={() => refreshThread()} 
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : thread ? (
            // Original Post
            <div className="p-4">
              <div className="flex items-start">
                {/* Display thread media */}
                {thread.media && thread.media.length > 0 ? (
                  <div className="flex-shrink-0 mr-4">
                    <MediaGallery mediaList={thread.media} size="medium" />
                  </div>
                ) : thread.images && thread.images.length > 0 && (
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
                  {thread.title && (
                    <div className="text-sm mb-2 font-bold">{thread.title}</div>
                  )}
                  <div className="text-sm mb-2 whitespace-pre-line">
                    {thread.content}
                  </div>
                  
                  <div className="flex mt-2">
                    <Button
                      onClick={() => handleQuotePost(thread.id)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-500"
                    >
                      <i className="fas fa-reply mr-1"></i> Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Replies */}
          <div className="border-t border-gray-200">
            {loading && posts.length === 0 ? (
              // Loading skeletons for replies
              Array(3).fill(0).map((_, index) => (
                <div className="post p-4" key={index}>
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12 ml-2" />
                        <Skeleton className="h-4 w-32 ml-2" />
                      </div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                    </div>
                  </div>
                </div>
              ))
            ) : posts.length === 0 && thread ? (
              <div className="post p-8 text-center text-gray-500">
                No replies yet. Be the first to respond!
              </div>
            ) : (
              // Actual replies
              posts.map(post => (
                <div className="post p-4" key={post.id}>
                  <div className="flex items-start">
                    {/* Display post media */}
                    {post.media && post.media.length > 0 ? (
                      <div className="flex-shrink-0 mr-4">
                        <MediaGallery mediaList={post.media} size="small" />
                      </div>
                    ) : post.images && post.images.length > 0 && (
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={post.images[0]} 
                          alt="Post attachment" 
                          className="post-image rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-bold text-primary">Anonymous</span>
                        <span className="ml-2 post-num">#{post.id.substring(0, 6)}</span>
                        <span className="ml-2 timestamp">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="text-sm mb-2 whitespace-pre-line">
                        {/* Show references to other posts */}
                        {post.references && post.references.length > 0 && post.references.some(ref => ref !== threadId) && (
                          <div className="mb-2">
                            {post.references.filter(ref => ref !== threadId).map(ref => (
                              <div key={ref} className="text-accent">
                                &gt;&gt;{ref.substring(0, 6)}
                              </div>
                            ))}
                          </div>
                        )}
                        {post.content}
                      </div>
                      
                      <div className="flex mt-2">
                        <Button
                          onClick={() => handleQuotePost(post.id)}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-500"
                        >
                          <i className="fas fa-reply mr-1"></i> Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Reply Form */}
          <div id="reply-form" className="p-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-bold mb-4 uppercase text-gray-600">Post Reply</h3>
            
            {selectedPostId && (
              <div className="mb-4 p-2 bg-gray-100 border-l-4 border-accent">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-accent">
                    Replying to #{selectedPostId.substring(0, 6)}
                  </span>
                  <Button
                    onClick={() => setSelectedPostId(null)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>
            )}
            
            <PostReplyForm onSubmitReply={handleSubmitReply} threadId={threadId} />
          </div>
        </div>
      </div>
    </div>
  );
};
