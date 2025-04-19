import React, { useState } from 'react';
import { useNostr } from '@/context/NostrContext';
import { PostPreview } from './PostPreview';

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
  const { getPost } = useNostr();
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = async (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom + window.scrollY;
    
    setPreviewPosition({ x, y });
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <span className="post-reference-container" style={{ position: 'relative' }}>
      <span 
        className="post-reference"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        &gt;&gt;{postId.substring(0, 8)}
      </span>
      
      {showPreview && (
        <div 
          className="post-preview-container" 
          style={{ 
            position: 'absolute',
            left: `${previewPosition.x}px`, 
            top: `${previewPosition.y + 10}px`
          }}
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <PostPreview 
            postId={postId} 
            threadId={threadId}
          />
        </div>
      )}
    </span>
  );
};