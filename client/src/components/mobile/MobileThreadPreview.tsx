import React from 'react';
import { Thread } from '@/types';
import { navigateWithoutReload } from '@/App';
import { formatDistanceToNow } from 'date-fns';
import { MarkdownContent } from '@/components/MarkdownContent';
import { MessageSquare, Clock } from 'lucide-react';

interface MobileThreadPreviewProps {
  thread: Thread;
  boardId: string;
}

const MobileThreadPreview: React.FC<MobileThreadPreviewProps> = ({ thread, boardId }) => {
  const navigateToThread = () => {
    // Store the current board path for back navigation
    localStorage.setItem('lastBoardPath', `/board/${boardId}`);
    navigateWithoutReload(`/thread/${thread.id}`);
  };
  
  // Format timestamps
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  // Truncate content if needed
  const getPreviewContent = (content: string): string => {
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  };
  
  // Get the first image if available
  const previewImage = thread.images && thread.images.length > 0 
    ? thread.images[0] 
    : (thread.media && thread.media.length > 0 && thread.media[0].type === 'image') 
      ? thread.media[0].url 
      : null;
  
  return (
    <div 
      className="mobile-thread-preview border-b p-3 active:bg-muted/30 transition-colors"
      onClick={navigateToThread}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-base line-clamp-1">{thread.title}</h3>
        <span className="text-xs text-foreground/60">
          #{thread.id.substring(0, 6)}
        </span>
      </div>
      
      <div className="flex">
        {previewImage && (
          <div className="mr-3 shrink-0">
            <img 
              src={previewImage} 
              alt="Thread preview" 
              className="w-20 h-20 object-cover rounded bg-muted/50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground/80 mb-1 line-clamp-3">
            <MarkdownContent 
              content={getPreviewContent(thread.content)}
              threadId={thread.id}
            />
          </div>
          
          <div className="flex items-center text-xs text-foreground/60 mt-2">
            <div className="flex items-center mr-3">
              <MessageSquare size={12} className="mr-1" />
              <span>{thread.replyCount || 0}</span>
            </div>
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>{formatTime(thread.lastReplyTime || thread.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileThreadPreview;