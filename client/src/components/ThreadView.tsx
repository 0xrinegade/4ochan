import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useThread } from "@/hooks/useThreads";
import { formatDate, formatPubkey, createThreadStatEvent } from "@/lib/nostr";
import { Button } from "@/components/ui/button";
import { PostReplyForm } from "@/components/PostReplyForm";
import { MediaGallery } from "@/components/MediaDisplay";
import { MediaContent } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadSubscribeButton } from "@/components/ThreadSubscribeButton";
import { useNostr } from "@/context/NostrContext";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PumpFunWidget } from "@/components/PumpFunWidget";
import { ThreadTree } from "@/components/ThreadTree";
import { ThreadContextVisualization } from "@/components/ThreadContextVisualization";
import { PostReference } from "@/components/PostReference";
import {
  ArrowUp,
  ArrowDown,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  GitMerge,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThreadViewProps {
  threadId: string;
  replyId?: string;
  setOpenGraphTags?: (title: string, description: string, imageUrl?: string) => void;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId, replyId, setOpenGraphTags }) => {
  const { thread, posts, loading, error, refreshThread, createPost } =
    useThread(threadId);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const {
    identity,
    publishEvent,
    getThreadStats,
    likePost,
    unlikePost,
    getPostLikes,
    isPostLikedByUser,
  } = useNostr();

  // State to track post likes
  const [postLikes, setPostLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [viewTracked, setViewTracked] = useState(false);
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { index: number; text: string; id: string }[]
  >([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(-1);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Load post likes data
  useEffect(() => {
    if (posts.length > 0 && identity) {
      const loadLikesData = async () => {
        try {
          // Create a new object to store likes count for each post
          const likesData: Record<string, number> = {};
          // Create a new object to track which posts the user has liked
          const userLikedData: Record<string, boolean> = {};

          // Load likes data for each post
          for (const post of posts) {
            try {
              // Get likes count
              const likesCount = await getPostLikes(post.id);
              likesData[post.id] = likesCount;

              // Check if user has liked this post
              const hasLiked = await isPostLikedByUser(post.id);
              userLikedData[post.id] = hasLiked;
            } catch (error) {
              console.error(
                `Failed to load likes data for post ${post.id}:`,
                error,
              );
            }
          }

          // Update state with likes data
          setPostLikes(likesData);
          setLikedPosts(userLikedData);
        } catch (error) {
          console.error("Failed to load likes data:", error);
        }
      };

      loadLikesData();
    }
  }, [posts, identity, getPostLikes, isPostLikedByUser]);

  // Scroll to specific reply if replyId is provided
  useEffect(() => {
    if (replyId && posts.length > 0 && !loading) {
      // Find the post with the specified replyId
      const specificPost = posts.find(post => post.id === replyId);
      
      if (specificPost) {
        // Scroll to the specific reply
        setTimeout(() => {
          scrollToResult(replyId);
          
          // If Open Graph tags setter is provided, generate tags for this reply
          if (setOpenGraphTags && thread) {
            // Get first few characters of the post content for the description
            const contentPreview = specificPost.content.substring(0, 150) + (specificPost.content.length > 150 ? '...' : '');
            
            // Set Open Graph tags for the specific reply
            setOpenGraphTags(
              `Reply in ${thread.title || 'Thread ' + thread.id.substring(0, 8)}`,
              contentPreview,
              specificPost.images && specificPost.images.length > 0 ? specificPost.images[0] : undefined
            );
          }
        }, 500); // Small delay to ensure the DOM is ready
      }
    } else if (thread && setOpenGraphTags && !replyId) {
      // Set Open Graph tags for the thread itself if no specific reply is requested
      setOpenGraphTags(
        thread.title || `Thread ${thread.id.substring(0, 8)}`,
        thread.content.substring(0, 150) + (thread.content.length > 150 ? '...' : ''),
        thread.images && thread.images.length > 0 ? thread.images[0] : undefined
      );
    }
  }, [replyId, posts, thread, loading, setOpenGraphTags]);

  // Track thread view and update thread statistics
  useEffect(() => {
    if (thread && !viewTracked && identity) {
      const trackThreadView = async () => {
        try {
          // Get current thread stats
          const stats = await getThreadStats(threadId);

          // Calculate new stats
          const newViewCount = (stats?.viewCount || 0) + 1;
          const newEngagement = Math.floor((stats?.engagement || 0) + 0.1); // Small engagement increment for view

          // Create and publish thread stat event
          const statEvent = await createThreadStatEvent(
            threadId,
            newViewCount,
            newEngagement,
            identity,
          );

          // Publish the stat event
          await publishEvent(statEvent);

          // Mark as tracked to prevent multiple tracking events
          setViewTracked(true);

          console.log(
            `Tracked view for thread ${threadId}, views: ${newViewCount}`,
          );
        } catch (error) {
          console.error("Failed to track thread view:", error);
        }
      };

      trackThreadView();
    }
  }, [thread, threadId, identity, publishEvent, getThreadStats, viewTracked]);

  // Scroll to the top of the thread
  const scrollToTop = () => {
    if (threadContainerRef.current) {
      threadContainerRef.current.parentElement?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Scroll to the bottom of the thread
  const scrollToBottom = () => {
    if (threadContainerRef.current) {
      const container = threadContainerRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  // Perform search in thread content
  const performSearch = () => {
    if (!searchQuery.trim() || !thread || !posts) return;

    const query = searchQuery.toLowerCase();
    const results: { index: number; text: string; id: string }[] = [];

    // Search in the thread title and content
    if (thread.title && thread.title.toLowerCase().includes(query)) {
      results.push({
        index: 0,
        text: thread.title,
        id: thread.id,
      });
    }

    if (thread.content && thread.content.toLowerCase().includes(query)) {
      results.push({
        index: 0,
        text: thread.content.substring(
          Math.max(0, thread.content.toLowerCase().indexOf(query) - 20),
          Math.min(
            thread.content.length,
            thread.content.toLowerCase().indexOf(query) + query.length + 20,
          ),
        ),
        id: thread.id,
      });
    }

    // Search in the posts content
    posts.forEach((post, index) => {
      if (post.content && post.content.toLowerCase().includes(query)) {
        results.push({
          index: index + 1, // +1 because the thread itself is at index 0
          text: post.content.substring(
            Math.max(0, post.content.toLowerCase().indexOf(query) - 20),
            Math.min(
              post.content.length,
              post.content.toLowerCase().indexOf(query) + query.length + 20,
            ),
          ),
          id: post.id,
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchResult(results.length > 0 ? 0 : -1);

    // Scroll to the first result if any
    if (results.length > 0) {
      scrollToResult(results[0].id);
    }
  };

  // Scroll to a specific search result
  const scrollToResult = (postId: string) => {
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: "smooth", block: "center" });
      postElement.classList.add("highlight-post");

      // Remove the highlight after a brief delay
      setTimeout(() => {
        postElement.classList.remove("highlight-post");
      }, 2000);
    }
  };

  // Navigate to the next search result
  const nextSearchResult = () => {
    if (searchResults.length === 0) return;

    const next = (currentSearchResult + 1) % searchResults.length;
    setCurrentSearchResult(next);
    scrollToResult(searchResults[next].id);
  };

  // Navigate to the previous search result
  const prevSearchResult = () => {
    if (searchResults.length === 0) return;

    const prev =
      (currentSearchResult - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchResult(prev);
    scrollToResult(searchResults[prev].id);
  };

  // Handle post being referenced for reply
  const handleQuotePost = (postId: string) => {
    setSelectedPostId(postId);

    // Scroll to reply form
    document
      .getElementById("reply-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle liking a post
  // Handle sharing a post by copying its link
  const handleSharePost = (postId: string) => {
    try {
      // Create a direct link to this specific reply
      const shareUrl = `${window.location.origin}/thread/${threadId}/reply/${postId}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Update state to show confirmation
        setCopiedPostId(postId);
        
        // Reset the copied state after a short delay
        setTimeout(() => {
          setCopiedPostId(null);
        }, 3000); // Increased from 2000ms to 3000ms for better visibility
      });
      
      // Add analytics tracking if needed
      // trackEvent('Share', { type: 'post', id: postId });
    } catch (error) {
      console.error('Failed to copy share link:', error);
      
      // Fallback method for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      const url = `${window.location.origin}/thread/${threadId}/reply/${postId}`;
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedPostId(postId);
        setTimeout(() => setCopiedPostId(null), 3000);
      } catch (err) {
        console.error('Fallback copy method failed:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!identity) return;

    try {
      // If post is already liked, unlike it
      if (likedPosts[postId]) {
        await unlikePost(postId);

        // Update like status in state
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: false,
        }));

        // Update likes count in state
        setPostLikes((prev) => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] || 0) - 1),
        }));
      }
      // Otherwise, like the post
      else {
        await likePost(postId);

        // Update like status in state
        setLikedPosts((prev) => ({
          ...prev,
          [postId]: true,
        }));

        // Update likes count in state
        setPostLikes((prev) => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error(
        `Failed to ${likedPosts[postId] ? "unlike" : "like"} post:`,
        error,
      );
    }
  };

  const handleSubmitReply = async (
    content: string,
    imageUrls: string[] = [],
    media?: MediaContent[],
  ) => {
    const replyToIds = selectedPostId ? [threadId, selectedPostId] : [threadId];

    // For backward compatibility, extract URLs from media objects if provided
    const allImageUrls = [...imageUrls];
    if (media && media.length > 0) {
      // Add any image URLs from the media objects
      const mediaUrls = media
        .filter((m) => m.type === "image")
        .map((m) => m.url);
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
            <Button
              variant="ghost"
              className="text-sm text-primary flex items-center"
            >
              <i className="fas fa-arrow-left mr-1"></i> Back to threads
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            {/* Only show subscribe button when thread is loaded */}
            {thread && (
              <ThreadSubscribeButton
                threadId={threadId}
                threadTitle={thread.title}
              />
            )}
            <Button
              onClick={() => refreshThread()}
              variant="ghost"
              className="text-sm text-accent"
              disabled={loading}
            >
              <i
                className={`fas fa-sync-alt mr-1 ${loading ? "animate-spin" : ""}`}
              ></i>{" "}
              Refresh
            </Button>
          </div>
        </div>

        {/* Thread Container */}
        <div
          ref={threadContainerRef}
          className="thread-container overflow-hidden"
        >
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
              <Button onClick={() => refreshThread()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : thread ? (
            <>
              {/* Thread Tabs - Content & Visualization */}
              <Tabs defaultValue="content" className="mb-4">
                <TabsList className="bg-gray-200 border border-black">
                  <TabsTrigger
                    value="content"
                    className="px-4 data-[state=active]:bg-amber-100 data-[state=active]:border-b-2 data-[state=active]:border-black"
                  >
                    Thread Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="visualization"
                    className="px-4 data-[state=active]:bg-amber-100 data-[state=active]:border-b-2 data-[state=active]:border-black"
                  >
                    <GitMerge className="h-4 w-4 mr-1 inline" />
                    Thread Visualization
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="pt-2">
                  {/* Original Post */}
                  <div id={`post-${thread.id}`} className="p-4 post">
                    <div className="flex items-start">
                      {/* Display thread media */}
                      {thread.media && thread.media.length > 0 ? (
                        <div className="flex-shrink-0 mr-4">
                          <MediaGallery
                            mediaList={thread.media}
                            size="medium"
                          />
                        </div>
                      ) : (
                        thread.images &&
                        thread.images.length > 0 && (
                          <div className="flex-shrink-0 mr-4">
                            <img
                              src={thread.images[0]}
                              alt="Thread attachment"
                              className="post-image rounded"
                            />
                          </div>
                        )
                      )}
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-bold text-primary">
                            Anonymous
                          </span>
                          <span className="ml-2 post-num">
                            #{thread.id.substring(0, 6)}
                          </span>
                          <span className="ml-2 timestamp">
                            {formatDate(thread.createdAt)}
                          </span>
                        </div>
                        {thread.title && (
                          <div className="text-sm mb-2 font-bold">
                            {thread.title}
                          </div>
                        )}
                        <div className="text-sm mb-2">
                          <MarkdownContent content={thread.content} />

                          {/* Check if this is the crypto board */}
                          {thread.boardId === "crypto" && thread.content && (
                            <PumpFunWidget content={thread.content} />
                          )}
                        </div>

                        <div className="flex mt-2 space-x-2">
                          <Button
                            onClick={() => handleQuotePost(thread.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500"
                          >
                            <i className="fas fa-reply mr-1"></i> Reply
                          </Button>

                          <Button
                            onClick={() => handleLikePost(thread.id)}
                            variant="ghost"
                            size="sm"
                            className={`text-xs ${likedPosts[thread.id] ? "text-accent" : "text-gray-500"}`}
                            title={
                              likedPosts[thread.id]
                                ? "Unlike this post"
                                : "Like this post"
                            }
                          >
                            {likedPosts[thread.id] ? (
                              <ThumbsUp size={14} className="mr-1" />
                            ) : (
                              <ThumbsUp size={14} className="mr-1" />
                            )}
                            {postLikes[thread.id] > 0 && (
                              <span>{postLikes[thread.id]}</span>
                            )}
                          </Button>
                          
                          {/* Share button for thread */}
                          <Button
                            onClick={() => handleSharePost(thread.id)}
                            variant={copiedPostId === thread.id ? "secondary" : "ghost"}
                            size="sm"
                            className={`text-xs ${copiedPostId === thread.id ? "bg-green-100 text-green-700 border-green-300" : "text-gray-500 hover:text-accent hover:bg-amber-50"}`}
                            title="Share this thread"
                          >
                            {copiedPostId === thread.id ? (
                              <Check size={14} className="mr-1 text-green-600" />
                            ) : (
                              <Share2 size={14} className="mr-1" />
                            )}
                            {copiedPostId === thread.id ? "Copied to clipboard!" : "Share link"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="visualization" className="pt-2">
                  <ThreadContextVisualization
                    threadId={threadId}
                    highlightedPostId={selectedPostId || undefined}
                  />
                </TabsContent>
              </Tabs>

              {/* Replies */}
              <div className="border-t border-gray-200">
                {loading && posts.length === 0 ? (
                  // Loading skeletons for replies
                  Array(3)
                    .fill(0)
                    .map((_, index) => (
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
                  posts.map((post) => (
                    <div
                      id={`post-${post.id}`}
                      className="post p-4"
                      key={post.id}
                    >
                      <div className="flex items-start">
                        {/* Display post media */}
                        {post.media && post.media.length > 0 ? (
                          <div className="flex-shrink-0 mr-4">
                            <MediaGallery mediaList={post.media} size="small" />
                          </div>
                        ) : (
                          post.images &&
                          post.images.length > 0 && (
                            <div className="flex-shrink-0 mr-4">
                              <img
                                src={post.images[0]}
                                alt="Post attachment"
                                className="post-image rounded"
                              />
                            </div>
                          )
                        )}
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-bold text-primary">
                              Anonymous
                            </span>
                            <span className="ml-2 post-num">
                              #{post.id.substring(0, 6)}
                            </span>
                            <span className="ml-2 timestamp">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm mb-2">
                            {/* Show references to other posts */}
                            {post.references &&
                              post.references.length > 0 &&
                              post.references.some(
                                (ref) => ref !== threadId,
                              ) && (
                                <div className="post-references mb-2 flex flex-wrap items-center">
                                  <span className="text-muted-foreground text-xs mr-2">Replying to:</span>
                                  {post.references
                                    .filter((ref) => ref !== threadId)
                                    .map((ref) => (
                                      <PostReference 
                                        key={ref} 
                                        postId={ref}
                                        threadId={threadId}
                                      />
                                    ))}
                                </div>
                              )}
                            <MarkdownContent content={post.content} />

                            {/* Check if this is the crypto board */}
                            {thread &&
                              thread.boardId === "crypto" &&
                              post.content && (
                                <PumpFunWidget content={post.content} />
                              )}
                          </div>

                          <div className="flex mt-2 space-x-2">
                            <Button
                              onClick={() => handleQuotePost(post.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-500"
                            >
                              <i className="fas fa-reply mr-1"></i> Reply
                            </Button>

                            <Button
                              onClick={() => handleLikePost(post.id)}
                              variant="ghost"
                              size="sm"
                              className={`text-xs ${likedPosts[post.id] ? "text-accent" : "text-gray-500"}`}
                              title={
                                likedPosts[post.id]
                                  ? "Unlike this post"
                                  : "Like this post"
                              }
                            >
                              {likedPosts[post.id] ? (
                                <ThumbsUp size={14} className="mr-1" />
                              ) : (
                                <ThumbsUp size={14} className="mr-1" />
                              )}
                              {postLikes[post.id] > 0 && (
                                <span>{postLikes[post.id]}</span>
                              )}
                            </Button>
                            
                            {/* Share button for reply */}
                            <Button
                              onClick={() => handleSharePost(post.id)}
                              variant={copiedPostId === post.id ? "secondary" : "ghost"}
                              size="sm"
                              className={`text-xs ${copiedPostId === post.id ? "bg-green-100 text-green-700 border-green-300" : "text-gray-500 hover:text-accent hover:bg-amber-50"}`}
                              title="Share this reply"
                            >
                              {copiedPostId === post.id ? (
                                <Check size={14} className="mr-1 text-green-600" />
                              ) : (
                                <Share2 size={14} className="mr-1" />
                              )}
                              {copiedPostId === post.id ? "Copied to clipboard!" : "Share link"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <div
                id="reply-form"
                className="p-4 bg-gray-50 border-t border-gray-200"
              >
                <h3 className="text-sm font-bold mb-4 uppercase text-gray-600">
                  Post Reply
                </h3>

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

                <PostReplyForm
                  onSubmitReply={handleSubmitReply}
                  threadId={threadId}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
