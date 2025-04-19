import React, { useEffect, useState } from 'react';
import { useNostr } from '@/context/NostrContext';
import { Post } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { MarkdownContent } from './MarkdownContent';

interface PostPreviewProps {
  postId: string;
  threadId: string;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ postId, threadId }) => {
  const { getPost } = useNostr();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childReferences, setChildReferences] = useState<string[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const fetchedPost = await getPost(postId);
        
        if (fetchedPost) {
          setPost(fetchedPost);
          
          // Extract referenced posts from content (>>postID format)
          const references = (fetchedPost.content.match(/>>([\w-]+)/g) || [])
            .map(ref => ref.substring(2))
            .filter(ref => ref !== postId); // Remove self-references
          
          setChildReferences(references);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, getPost]);

  if (loading) {
    return (
      <div className="post-preview">
        <div className="p-3">
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-preview">
        <div className="p-3">
          <p className="text-destructive">Error: {error || 'Post not found'}</p>
        </div>
      </div>
    );
  }

  // Get first image if any
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let images: string[] = [];
  let match;
  while ((match = imageRegex.exec(post.content)) !== null) {
    if (match[1]) {
      const url = match[1];
      if (
        url.endsWith('.jpg') || 
        url.endsWith('.jpeg') || 
        url.endsWith('.png') || 
        url.endsWith('.gif') || 
        url.endsWith('.webp')
      ) {
        images.push(url);
      }
    }
  }

  return (
    <div className="post-preview">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="post-num">{post.id.substring(0, 8)}</span>
          <span className="text-xs text-muted-foreground">
            {post.authorName || post.authorPubkey.substring(0, 8)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
        
        {images.length > 0 && (
          <div className="post-preview-images flex gap-1 mb-2">
            {images.slice(0, 3).map((img, index) => (
              <img key={index} src={img} alt="Preview" />
            ))}
            {images.length > 3 && <span className="text-xs">+{images.length - 3} more</span>}
          </div>
        )}
        
        <div className="preview-content">
          <MarkdownContent 
            content={post.content.length > 250 
              ? post.content.substring(0, 250) + '...' 
              : post.content
            } 
            threadId={threadId}
          />
        </div>
        
        {childReferences.length > 0 && (
          <div className="child-references">
            <span className="text-xs font-semibold mb-1">References:</span>
            <div className="flex flex-wrap gap-1 nested-preview-container">
              {childReferences.slice(0, 3).map(refId => (
                <div key={refId} className="text-xs">
                  <span className="post-reference">&gt;&gt;{refId.substring(0, 8)}</span>
                </div>
              ))}
              {childReferences.length > 3 && (
                <span className="text-xs">+{childReferences.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};