import React, { useState, useEffect, useRef } from 'react';
import { useNostr } from '@/context/NostrContext';
import { Post } from '@/types';
import { PostPreview } from '@/components/PostPreview';

interface PostReferenceProps {
  postId: string;
  onClick?: () => void;
  threadId: string;
}

export const PostReference: React.FC<PostReferenceProps> = ({ 
  postId, 
  onClick,
  threadId
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [childRefs, setChildRefs] = useState<string[]>([]);
  const { getPost, getPostsByThread } = useNostr();
  const refContainerRef = useRef<HTMLSpanElement>(null);

  // Load the post data
  useEffect(() => {
    const loadPost = async () => {
      if (showPreview && !post && !loading && !error) {
        setLoading(true);
        try {
          // Get the post from Nostr
          const loadedPost = await getPost(postId);
          if (loadedPost) {
            setPost(loadedPost);

            // Check if this post has references by other posts
            const allPosts = await getPostsByThread(threadId);
            const refs = allPosts
              .filter(p => p.references && p.references.includes(postId))
              .map(p => p.id);
            setChildRefs(refs);
          } else {
            setError('Post not found');
          }
        } catch (err) {
          setError('Failed to load post');
          console.error('Error loading post:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPost();
  }, [showPreview, post, loading, error, postId, getPost, getPostsByThread, threadId]);

  // Calculate and update the preview position when showing
  useEffect(() => {
    if (showPreview && refContainerRef.current) {
      const rect = refContainerRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const isRightHalf = rect.left > windowWidth / 2;

      // If on the right half of the screen, show preview to the left
      if (isRightHalf) {
        setPreviewPosition({
          top: rect.top,
          left: rect.left - 330 // Adjust based on preview width
        });
      } else {
        setPreviewPosition({
          top: rect.top,
          left: rect.right + 10
        });
      }
    }
  }, [showPreview]);

  // Handle scrolling to the referenced post
  const handleClick = () => {
    // Find and scroll to the referenced post
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: "smooth", block: "center" });
      postElement.classList.add("highlight-post");

      // Remove the highlight after a brief delay
      setTimeout(() => {
        postElement.classList.remove("highlight-post");
      }, 2000);
    }

    if (onClick) onClick();
  };

  return (
    <span 
      ref={refContainerRef}
      className="post-reference inline-block text-accent font-mono cursor-pointer hover:underline mr-1"
      onClick={handleClick}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      &gt;&gt;{postId.substring(0, 8)}
      
      {showPreview && (
        <div 
          className="post-preview-container absolute z-50"
          style={{ 
            top: `${previewPosition.top}px`, 
            left: `${previewPosition.left}px` 
          }}
        >
          {loading && (
            <div className="bg-background border-2 border-black p-2 text-sm">
              Loading post...
            </div>
          )}
          
          {error && (
            <div className="bg-background border-2 border-black p-2 text-sm text-destructive">
              {error}
            </div>
          )}
          
          {post && (
            <div className="nested-preview-container">
              <PostPreview 
                post={post} 
                onClose={() => setShowPreview(false)} 
              />
              
              {/* Child references - replies to this post */}
              {childRefs.length > 0 && (
                <div className="child-references pl-4 mt-1 border-l-2 border-accent bg-background border-2 border-black p-2">
                  <div className="text-xs text-muted-foreground mb-1">Replies:</div>
                  {childRefs.map(refId => (
                    <PostReference 
                      key={refId} 
                      postId={refId} 
                      threadId={threadId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
};