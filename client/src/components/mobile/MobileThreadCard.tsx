import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Eye, Heart, Image, ExternalLink } from 'lucide-react';
import { navigateWithoutReload } from '@/App';
import { Thread, Post } from '@/types';
import { formatPubkey } from '@/lib/nostr';

interface MobileThreadCardProps {
  thread: Thread;
  onThreadClick?: (threadId: string) => void;
  className?: string;
}

/**
 * A card component for displaying threads in the mobile PWA interface
 * Optimized for touch interactions and mobile viewing
 */
const MobileThreadCard: React.FC<MobileThreadCardProps> = ({ 
  thread, 
  onThreadClick,
  className = '',
}) => {
  // Format the creation date relative to now (e.g., "2 hours ago")
  const formattedDate = formatDistanceToNow(new Date(thread.createdAt * 1000), { addSuffix: true });
  
  // Format the author's pubkey for display
  const formattedAuthor = formatPubkey(thread.authorPubkey || '');
  
  // Handle click event
  const handleClick = () => {
    if (onThreadClick) {
      onThreadClick(thread.id);
    } else {
      navigateWithoutReload(`/thread/${thread.id}`);
    }
  };
  
  // Get the first 100 characters of content for preview
  const contentPreview = thread.content ? 
    thread.content.substring(0, 100) + (thread.content.length > 100 ? '...' : '') 
    : '';
  
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all active:bg-gray-50 dark:active:bg-gray-700 animate-scaleIn ${className}`}
      onClick={handleClick}
    >
      {/* Thread header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium text-sm line-clamp-1">{thread.title}</h3>
          
          {thread.images && thread.images.length > 0 && (
            <div className="text-blue-500 flex items-center text-xs">
              <Image size={12} className="mr-0.5" />
              <span>{thread.images.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{formattedAuthor}</span>
          <span className="mx-1.5">•</span>
          <span>{formattedDate}</span>
          
          {thread.boardId && (
            <>
              <span className="mx-1.5">•</span>
              <span className="text-primary">/{thread.boardId}/</span>
            </>
          )}
        </div>
      </div>
      
      {/* Thread content preview */}
      {contentPreview && (
        <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          {contentPreview}
        </div>
      )}
      
      {/* Thread stats */}
      <div className="px-3 py-2 flex items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center mr-3">
          <MessageCircle size={12} className="mr-1" />
          <span>{thread.replyCount || 0}</span>
        </div>
        
        <div className="flex items-center mr-3">
          <Eye size={12} className="mr-1" />
          <span>{0}</span> {/* Thread view count could be implemented in the future */}
        </div>
        
        <div className="flex items-center">
          <Heart size={12} className="mr-1" />
          <span>{0}</span> {/* Thread like count could be implemented in the future */}
        </div>
      </div>
    </div>
  );
};

export default MobileThreadCard;