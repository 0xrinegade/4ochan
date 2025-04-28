import React, { useState, useRef, useEffect } from 'react';
import { Thread, Post } from '@/types';
import { MarkdownContent } from '@/components/MarkdownContent';
import { formatDistanceToNow } from 'date-fns';
import { 
  ThumbsUp, ThumbsDown, MessageCircle, Share, MoreVertical,
  Clock, RefreshCw, Send, ChevronDown, ChevronUp, Image, 
  Copy, Flag, Link, Bookmark, CornerUpRight, X, Users,
  MessageSquare, ExternalLink
} from 'lucide-react';
import { useNostr } from '@/context/NostrContext';
import DOMPurify from 'dompurify';

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
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [expandedImages, setExpandedImages] = useState<string[]>([]);
  const [viewingInfo, setViewingInfo] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  // Format timestamps
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  // Get thread images
  const threadImages = thread.images || (thread.media?.filter(m => m.type === 'image').map(m => m.url)) || [];
  
  // Handle opening image in fullscreen/expanded view
  const toggleImageExpand = (imageUrl: string) => {
    if (expandedImages.includes(imageUrl)) {
      setExpandedImages(expandedImages.filter(url => url !== imageUrl));
    } else {
      setExpandedImages([...expandedImages, imageUrl]);
    }
  };
  
  // Handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContainerRef.current) return;
      setShowScrollToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to handle submitting a reply
  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;
    
    // This is where you'd normally submit the reply
    // We'll mock this for now
    alert(`Reply submitted: ${replyContent}`);
    setReplyContent('');
    setIsReplying(false);
  };
  
  // Function to generate a gradient color for avatars based on user pubkey
  const getUserAvatarGradient = (pubkey: string): string => {
    const gradients = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-indigo-400',
      'from-pink-500 to-rose-400',
      'from-green-500 to-emerald-400',
      'from-orange-500 to-amber-400',
      'from-red-500 to-rose-400',
      'from-indigo-500 to-blue-400',
      'from-teal-500 to-green-400'
    ];
    
    // Use pubkey hash to deterministically pick a color
    const index = pubkey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };
  
  // Get user initial for avatar
  const getUserInitial = (authorName: string | undefined, pubkey: string): string => {
    if (authorName && authorName.length > 0) {
      return authorName[0].toUpperCase();
    }
    // Use the first character of the pubkey for anonymous users
    return pubkey.substring(0, 1).toUpperCase();
  };
  
  // Calculate estimated read time
  const getReadTime = (content: string): string => {
    // Average reading speed: 200 words per minute
    const words = content.split(/\s+/).length;
    const minutes = Math.round(words / 200);
    return minutes < 1 ? '< 1 min read' : `${minutes} min read`;
  };
  
  return (
    <div className="mobile-thread-view pb-20 bg-gray-50 dark:bg-gray-900 min-h-screen" ref={mainContainerRef}>
      {/* Thread header - Fixed at top */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-3 border-b dark:border-gray-700">
          <div className="flex justify-between items-start">
            <h1 className="text-lg font-bold line-clamp-1 pr-2">{thread.title}</h1>
            <div className="flex gap-1">
              <button
                onClick={() => setViewingInfo(!viewingInfo)}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                aria-label="Thread Info"
              >
                <Users size={16} />
              </button>
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                aria-label="Refresh"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          
          {viewingInfo && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 pt-2 animate-in fade-in duration-200">
              <div className="flex justify-between">
                <div>Thread ID: #{thread.id.substring(0, 8)}</div>
                <div>{formatTime(thread.createdAt)}</div>
              </div>
              <div className="flex justify-between mt-1">
                <div>Author: {thread.authorName || thread.authorPubkey.substring(0, 8)}</div>
                <div>{posts.length} replies</div>
              </div>
              <div className="flex justify-end mt-1">
                <button 
                  className="text-xs text-primary flex items-center"
                  onClick={() => setViewingInfo(false)}
                >
                  Close <X size={12} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main thread content */}
      <div className="thread-content-wrapper">
        {/* Original Post */}
        <div className="p-4 bg-white dark:bg-gray-800 shadow-sm mb-2">
          <div className="flex mb-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getUserAvatarGradient(thread.authorPubkey)} flex items-center justify-center text-white font-bold mr-3`}>
              {getUserInitial(thread.authorName, thread.authorPubkey)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {thread.authorName || `Anon-${thread.authorPubkey.substring(0, 6)}`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Clock size={12} className="mr-1" />
                <span>{formatTime(thread.createdAt)}</span>
                <span className="mx-1">•</span>
                <span>{getReadTime(thread.content)}</span>
              </div>
            </div>
          </div>
          
          {threadImages.length > 0 && (
            <div className="mb-4 space-y-2">
              {threadImages.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img}
                    alt={`Thread image ${i + 1}`}
                    className={`rounded-lg border border-gray-200 dark:border-gray-700 ${
                      expandedImages.includes(img) ? 'w-full' : 'max-h-96 object-contain'
                    }`}
                    onClick={() => toggleImageExpand(img)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="thread-content prose dark:prose-invert prose-sm max-w-none mb-4">
            <MarkdownContent 
              content={thread.content} 
              threadId={thread.id} 
            />
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
            <div className="flex items-center text-sm space-x-4">
              <button className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary">
                <ThumbsUp size={18} className="mr-1" />
                <span>{thread.likes || 0}</span>
              </button>
              
              <button className="flex items-center text-gray-500 dark:text-gray-400">
                <MessageCircle size={18} className="mr-1" />
                <span>{posts.length || 0}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary">
                <Bookmark size={18} />
              </button>
              <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary">
                <Share size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Reply Button - Mobile UX optimization */}
        <button 
          onClick={() => {
            setIsReplying(true);
            setTimeout(() => replyInputRef.current?.focus(), 100);
          }}
          className="mx-4 mb-4 w-full py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-left text-gray-500 dark:text-gray-400 shadow-sm flex items-center"
        >
          <Send size={14} className="mr-2 rotate-[-30deg]" />
          Write a reply...
        </button>
        
        {/* Replies section */}
        <div className="replies-section">
          <div className="px-4 pb-2 flex justify-between items-center">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Replies ({posts.length})
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isLoading ? 'Refreshing...' : 'Latest first'}
            </div>
          </div>
          
          {isLoading && posts.length === 0 ? (
            <div className="p-4">
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 animate-pulse">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm mx-4">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
              <p className="font-medium">No replies yet</p>
              <p className="text-sm mt-1">Be the first to respond to this thread!</p>
            </div>
          ) : (
            <div className="space-y-2 px-4">
              {posts.map((post) => (
                <MobilePostItem 
                  key={post.id} 
                  post={post} 
                  threadId={thread.id}
                  onLike={() => onLikePost(post.id)}
                  onUnlike={() => onUnlikePost(post.id)}
                  onReply={() => {
                    setIsReplying(true);
                    // Add reference to this post
                    setReplyContent(prev => `>>${post.id.substring(0, 8)}\n${prev}`);
                    setTimeout(() => replyInputRef.current?.focus(), 100);
                  }}
                  toggleImageExpand={toggleImageExpand}
                  expandedImages={expandedImages}
                  getUserAvatarGradient={getUserAvatarGradient}
                  getUserInitial={getUserInitial}
                  formatTime={formatTime}
                />
              ))}
              
              {/* Load more button (would be implemented with pagination) */}
              {posts.length > 10 && (
                <button className="w-full py-2.5 text-center text-sm font-medium text-primary bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  Load more replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Reply input (when active) */}
      {isReplying && (
        <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-3 z-40 animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Reply to Thread</h3>
            <button 
              onClick={() => setIsReplying(false)}
              className="p-1 text-gray-500 dark:text-gray-400"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-start">
            <textarea
              ref={replyInputRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            ></textarea>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex">
              <button className="p-2 text-gray-500 dark:text-gray-400">
                <Image size={18} />
              </button>
            </div>
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                replyContent.trim() 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      {/* Scroll to top button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 w-10 h-10 rounded-full bg-primary/90 text-white shadow-lg flex items-center justify-center z-30"
          aria-label="Scroll to top"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
};

interface MobilePostItemProps {
  post: Post;
  threadId: string;
  onLike: () => void;
  onUnlike: () => void;
  onReply: () => void;
  toggleImageExpand: (imageUrl: string) => void;
  expandedImages: string[];
  getUserAvatarGradient: (pubkey: string) => string;
  getUserInitial: (name: string | undefined, pubkey: string) => string;
  formatTime: (timestamp: number) => string;
}

const MobilePostItem: React.FC<MobilePostItemProps> = ({ 
  post, 
  threadId, 
  onLike, 
  onUnlike, 
  onReply,
  toggleImageExpand,
  expandedImages,
  getUserAvatarGradient,
  getUserInitial,
  formatTime
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(post.content.length > 300);
  
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
    <div id={`post-${post.id}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 relative">
      {/* If this is a reply to another post, show a visual indicator */}
      {post.references && post.references.length > 0 && (
        <div className="absolute top-0 left-4 w-0.5 h-3 bg-primary/30 -mt-3"></div>
      )}
      
      <div className="flex items-start">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getUserAvatarGradient(post.authorPubkey)} flex items-center justify-center text-white font-bold mr-2 shrink-0`}>
          {getUserInitial(post.authorName, post.authorPubkey)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-sm">
                {post.authorName || `Anon-${post.authorPubkey.substring(0, 6)}`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(post.createdAt)}
              </div>
            </div>
            
            <div className="relative">
              <button 
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setOptionsOpen(!optionsOpen)}
              >
                <MoreVertical size={14} />
              </button>
              
              {optionsOpen && (
                <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20 min-w-[140px]">
                  <button 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    onClick={() => {
                      navigator.clipboard.writeText(post.id);
                      setOptionsOpen(false);
                    }}
                  >
                    <Copy size={14} className="mr-2" />
                    Copy ID
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/thread/${threadId}#post-${post.id}`);
                      setOptionsOpen(false);
                    }}
                  >
                    <Link size={14} className="mr-2" />
                    Copy link
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-500"
                    onClick={() => {
                      alert('Report function would go here');
                      setOptionsOpen(false);
                    }}
                  >
                    <Flag size={14} className="mr-2" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* References to other posts */}
          {post.references && post.references.length > 0 && (
            <div className="mt-1 mb-2 text-xs text-primary flex flex-wrap">
              <span className="mr-1 text-gray-500 dark:text-gray-400">Replying to:</span>
              {post.references.map((refId, i) => (
                <a 
                  key={i}
                  href={`#post-${refId}`}
                  className="mr-1.5 text-primary flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(`post-${refId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      // Briefly highlight the referenced post
                      element.classList.add('bg-primary/10');
                      setTimeout(() => {
                        element.classList.remove('bg-primary/10');
                      }, 1000);
                    }
                  }}
                >
                  <CornerUpRight size={11} className="mr-0.5" />
                  {refId.substring(0, 6)}
                </a>
              ))}
            </div>
          )}
          
          {/* Post images */}
          {postImages.length > 0 && (
            <div className="mt-2 mb-3 space-y-2">
              {postImages.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img}
                    alt={`Post image ${i + 1}`}
                    className={`rounded-lg border border-gray-200 dark:border-gray-700 ${
                      expandedImages.includes(img) ? 'w-full' : 'max-h-60 object-contain'
                    }`}
                    onClick={() => toggleImageExpand(img)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Post content */}
          <div className={`post-content mt-1 prose dark:prose-invert prose-sm max-w-none overflow-hidden ${contentCollapsed ? 'max-h-32' : ''}`}>
            <MarkdownContent 
              content={contentCollapsed ? post.content.substring(0, 300) + '...' : post.content} 
              threadId={threadId} 
            />
          </div>
          
          {/* Show more/less button for long posts */}
          {post.content.length > 300 && (
            <button 
              className="mt-1 text-xs font-medium text-primary flex items-center"
              onClick={() => setContentCollapsed(!contentCollapsed)}
            >
              {contentCollapsed ? (
                <>Read more <ChevronDown size={12} className="ml-0.5" /></>
              ) : (
                <>Show less <ChevronUp size={12} className="ml-0.5" /></>
              )}
            </button>
          )}
          
          {/* Post actions */}
          <div className="mt-2 pt-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className={`flex items-center text-sm ${
                  post.likedByUser ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={handleLikeToggle}
              >
                <ThumbsUp size={16} className="mr-1" />
                <span className="text-xs">{post.likes || 0}</span>
              </button>
              
              <button 
                className="flex items-center text-gray-500 dark:text-gray-400 text-sm"
                onClick={onReply}
              >
                <MessageCircle size={16} className="mr-1" />
                <span className="text-xs">Reply</span>
              </button>
            </div>
            
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500">#{post.id.substring(0, 6)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileThreadView;