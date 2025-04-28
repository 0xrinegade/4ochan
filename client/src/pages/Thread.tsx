import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Header } from "@/components/Header";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThreadView } from "@/components/ThreadView";
import { useNostr } from "@/hooks/useNostr";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import MobileThreadView from "@/components/mobile/MobileThreadView";
import MobileWrapper from "@/components/mobile/MobileWrapper";
import { useThread } from "@/hooks/useThreads";
import { Thread as ThreadType, Post } from "@/types";

// Helper function to set Open Graph and Twitter Card meta tags
const setOpenGraphTags = (title: string, description: string, imageUrl?: string) => {
  // Find existing OG and Twitter tags and remove them
  document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').forEach(tag => tag.remove());
  
  // Combine site name with title for better display in previews
  const formattedTitle = `${title} | 4ochan.org`;
  
  // Base meta tags for OpenGraph
  const metaTags = [
    { property: 'og:title', content: formattedTitle },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: window.location.href.includes('https://') 
      ? window.location.href 
      : `https://4ochan.org${window.location.pathname}` },
    { property: 'og:site_name', content: '4ochan.org' },
  ];
  
  // Twitter Card tags
  const twitterTags = [
    { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: formattedTitle },
    { name: 'twitter:description', content: description },
  ];
  
  // Add image tags if provided
  if (imageUrl) {
    // Make sure image URL is absolute
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://4ochan.org${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    metaTags.push({ property: 'og:image', content: absoluteImageUrl });
    twitterTags.push({ name: 'twitter:image', content: absoluteImageUrl });
  } else {
    // Add a default image tag using the official 4ochan logo
    const defaultImage = 'https://4ochan.org/images/logo-4o.png';
    metaTags.push({ property: 'og:image', content: defaultImage });
    twitterTags.push({ name: 'twitter:image', content: defaultImage });
  }
  
  // Create and append the OpenGraph meta tags
  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', tag.property);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });
  
  // Create and append the Twitter Card meta tags
  twitterTags.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', tag.name);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });
  
  // Also update the document title for better browser history/tabs
  document.title = formattedTitle;
};

interface ThreadProps {
  id?: string;
  replyId?: string;
}

const Thread: React.FC<ThreadProps> = ({ id, replyId }) => {
  // If id is not passed as a prop, try to get it from the URL params
  const params = useParams<{ id: string; replyId: string }>();
  const threadId = id || params.id;
  const specificReplyId = replyId || params.replyId;
  
  const { connectedRelays, connect } = useNostr();
  const isMobile = useIsMobile();
  const { isMobile: isMobilePwa } = useMobileDetection();

  // For mobile version, fetch thread data
  const { thread, posts, loading, refreshThread } = useThread(threadId);
  const { likePost, unlikePost } = useNostr();
  const [loadedThread, setLoadedThread] = useState<ThreadType | null>(null);
  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  
  // Set thread data for mobile view when it's available
  useEffect(() => {
    if (thread) {
      setLoadedThread(thread);
    }
  }, [thread]);

  // Set posts data for mobile view when it's available
  useEffect(() => {
    if (posts && posts.length > 0) {
      setLoadedPosts(posts);
    }
  }, [posts]);

  // Set default OpenGraph tags on component mount
  useEffect(() => {
    // Set initial/default OpenGraph tags
    const title = specificReplyId 
      ? `Reply to Thread #${threadId.substring(0, 6)}` 
      : `Thread #${threadId.substring(0, 6)}`;
      
    const description = specificReplyId
      ? `View this specific reply in the thread on 4ochan.org` 
      : `View this thread on 4ochan.org`;
      
    setOpenGraphTags(title, description);
    
    // This will be updated later when the actual thread data loads
  }, [threadId, specificReplyId]);

  // Handle like/unlike post actions for mobile view
  const handleLikePost = async (postId: string) => {
    try {
      await likePost(postId);
      // Update the local posts state to reflect the like
      setLoadedPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: (post.likes || 0) + 1,
            likedByUser: true
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleUnlikePost = async (postId: string) => {
    try {
      await unlikePost(postId);
      // Update the local posts state to reflect the unlike
      setLoadedPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: Math.max((post.likes || 0) - 1, 0),
            likedByUser: false
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Failed to unlike post:", error);
    }
  };

  // Mobile PWA view
  if (isMobilePwa && loadedThread) {
    return (
      <MobileWrapper
        title={loadedThread.title.length > 30 ? 
          `${loadedThread.title.substring(0, 30)}...` : 
          loadedThread.title
        }
        showBackButton={true}
        isLoading={loading}
        rightAction="more"
        hideNavigation={false}
      >
        <MobileThreadView
          thread={loadedThread}
          posts={loadedPosts}
          isLoading={loading}
          onRefresh={refreshThread}
          onLikePost={handleLikePost}
          onUnlikePost={handleUnlikePost}
        />
      </MobileWrapper>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Show sidebar on desktop, hide on mobile */}
        {!isMobile && <BoardSidebar />}
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {connectedRelays === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-plug text-4xl text-primary mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Not Connected to Relays</h2>
                <p className="text-gray-600 mb-4">
                  Connect to Nostr relays to view this thread.
                </p>
                <Button onClick={() => connect()} className="bg-primary">
                  Connect Now
                </Button>
              </div>
            </div>
          ) : !threadId ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded shadow-sm text-center max-w-md">
                <i className="fas fa-exclamation-triangle text-4xl text-accent mb-4"></i>
                <h2 className="text-xl font-bold mb-2">Thread Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The thread you're looking for doesn't exist or couldn't be loaded.
                </p>
              </div>
            </div>
          ) : (
            <ThreadView threadId={threadId} replyId={specificReplyId} setOpenGraphTags={setOpenGraphTags} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Thread;
