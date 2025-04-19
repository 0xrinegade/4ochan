import React from 'react';
import { Post } from '@/types';
import { MarkdownContent } from '@/components/MarkdownContent';
import { formatDate } from '@/lib/nostr';

interface PostPreviewProps {
  post: Post;
  onClose: () => void;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ post, onClose }) => {
  return (
    <div 
      className="post-preview bg-background border-2 border-black shadow-md p-2 max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="post-preview-header flex justify-between items-center text-xs mb-1 border-b border-border pb-1">
        <div className="flex gap-2">
          <span className="font-bold">Anonymous</span>
          <span className="text-gray-500">{formatDate(post.createdAt)}</span>
        </div>
        <button 
          onClick={onClose}
          className="hover:text-destructive"
        >
          ×
        </button>
      </div>
      <div className="post-preview-content text-sm max-h-48 overflow-y-auto">
        <MarkdownContent content={post.content} />
      </div>
      {post.images && post.images.length > 0 && (
        <div className="post-preview-images mt-1 flex gap-1 overflow-x-auto">
          {post.images.slice(0, 2).map((imageUrl, idx) => (
            <img 
              key={idx} 
              src={imageUrl} 
              alt={`Attachment ${idx + 1}`} 
              className="h-16 w-16 object-cover border border-border"
            />
          ))}
          {post.images.length > 2 && (
            <div className="h-16 w-16 flex items-center justify-center bg-muted border border-border text-muted-foreground">
              +{post.images.length - 2}
            </div>
          )}
        </div>
      )}
    </div>
  );
};