import React, { useState } from 'react';
import { Thread, Post } from '@/types';
import { MarkdownContent } from '@/components/MarkdownContent';
import { formatDistanceToNow } from 'date-fns';
import { 
  ThumbsUp, MessageCircle, Share, MoreVertical,
  Clock, RefreshCw
} from 'lucide-react';
import { useNostr } from '@/context/NostrContext';

interface MobileThreadViewProps {
  thread: Thread;
  posts: Post[];
  isLoading: boolean;
  onRefresh: () => void;
  onLikePost: (postId: string) => void;
  onUnlikePost: (postId: string) => void;
}

const MobileThreadView: React.FC<MobileThreadViewProps> = ({
  thread,
  posts,
  isLoading,
  onRefresh,
  onLikePost,
  onUnlikePost
}) => {
  // Format timestamps
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  // Get thread images
  const threadImages = thread.images || (thread.media?.filter(m => m.type === 'image').map(m => m.url)) || [];
  
  return (
    <div className="mobile-thread-view pb-5">
      {/* Thread header/original post */}
      <div className="p-3 border-b pb-5">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-lg font-bold">{thread.title}</h1>
          <button
            onClick={onRefresh}
            className="p-1 rounded-full hover:bg-muted/50"
            aria-label="Refresh"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex items-center text-xs text-foreground/60 mb-3">
          <span className="mr-2">#{thread.id.substring(0, 8)}</span>
          <Clock size={12} className="mr-1" />
          <span>{formatTime(thread.createdAt)}</span>
        </div>
        
        {threadImages.length > 0 && (
          <div className="mb-3 space-y-2">
            {threadImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Thread image ${i + 1}`}
                className="max-w-full rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
        )}
        
        <div className="thread-content">
          <MarkdownContent 
            content={thread.content} 
            threadId={thread.id} 
          />
        </div>
        
        <div className="mt-4 flex justify-between">
          <div className="flex items-center text-sm space-x-5">
            <button className="flex items-center text-foreground/70">
              <ThumbsUp size={16} className="mr-1" />
              <span>0</span>
            </button>
            
            <button className="flex items-center text-foreground/70">
              <MessageCircle size={16} className="mr-1" />
              <span>{posts.length || 0}</span>
            </button>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 text-foreground/70 hover:bg-muted/50 rounded-full">
              <Share size={16} />
            </button>
            <button className="p-2 text-foreground/70 hover:bg-muted/50 rounded-full">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Replies section */}
      <div className="replies-section">
        <div className="px-3 py-2 text-sm font-medium border-b">
          Replies ({posts.length})
        </div>
        
        {isLoading && posts.length === 0 ? (
          <div className="p-4">
            <div className="animate-pulse space-y-5">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex">
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full mb-1"></div>
                    <div className="h-3 bg-muted rounded w-full mb-1"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center text-foreground/60">
            <p>No replies yet.</p>
            <p className="text-sm mt-1">Be the first to respond!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <MobilePostItem 
                key={post.id} 
                post={post} 
                threadId={thread.id}
                onLike={() => onLikePost(post.id)}
                onUnlike={() => onUnlikePost(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MobilePostItemProps {
  post: Post;
  threadId: string;
  onLike: () => void;
  onUnlike: () => void;
}

const MobilePostItem: React.FC<MobilePostItemProps> = ({ post, threadId, onLike, onUnlike }) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  
  // Format timestamps
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  // Handle like toggle
  const handleLikeToggle = () => {
    if (post.likedByUser) {
      onUnlike();
    } else {
      onLike();
    }
  };
  
  // Get post images
  const postImages = post.images || (post.media?.filter(m => m.type === 'image').map(m => m.url)) || [];
  
  return (
    <div id={`post-${post.id}`} className="mobile-post p-3">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center text-xs text-foreground/60">
          <span className="mr-2 font-medium">
            {post.authorName || post.authorPubkey.substring(0, 8)}
          </span>
          <span className="mr-2">#{post.id.substring(0, 8)}</span>
          <Clock size={12} className="mr-1" />
          <span>{formatTime(post.createdAt)}</span>
        </div>
        
        <div className="relative">
          <button 
            className="p-1 text-foreground/70 hover:bg-muted/50 rounded-full"
            onClick={() => setOptionsOpen(!optionsOpen)}
          >
            <MoreVertical size={14} />
          </button>
          
          {optionsOpen && (
            <div className="absolute right-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[120px]">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50">
                Copy ID
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50">
                Copy link
              </button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 text-destructive">
                Report
              </button>
            </div>
          )}
        </div>
      </div>
      
      {post.references && post.references.length > 0 && (
        <div className="mb-2 text-xs text-foreground/70 flex flex-wrap">
          <span className="mr-1">Replying to:</span>
          {post.references.map((refId, i) => (
            <a 
              key={i}
              href={`#post-${refId}`}
              className="mr-1 underline text-primary/70"
            >
              &gt;&gt;{refId.substring(0, 6)}
            </a>
          ))}
        </div>
      )}
      
      {postImages.length > 0 && (
        <div className="mb-2 space-y-2">
          {postImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Post image ${i + 1}`}
              className="max-w-full rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      )}
      
      <div className="post-content">
        <MarkdownContent 
          content={post.content} 
          threadId={threadId} 
        />
      </div>
      
      <div className="mt-2 flex items-center">
        <button 
          className={`flex items-center mr-4 ${
            post.likedByUser ? 'text-accent' : 'text-foreground/60'
          }`}
          onClick={handleLikeToggle}
        >
          <ThumbsUp size={14} className="mr-1" />
          <span className="text-xs">{post.likes || 0}</span>
        </button>
        
        <button className="flex items-center text-foreground/60">
          <MessageCircle size={14} className="mr-1" />
          <span className="text-xs">Reply</span>
        </button>
      </div>
    </div>
  );
};

export default MobileThreadView;