import React, { useState } from 'react';
import { useNostr } from '@/context/NostrContext';
import { PostPreview } from './PostPreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showModal, setShowModal] = useState(false);

  const handleMouseEnter = async (e: React.MouseEvent) => {
    setShowModal(true);
  };

  const handleMouseLeave = () => {
    // We'll keep the modal open if the mouse is over it
    // and rely on Dialog's built-in close mechanisms
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <span className="post-reference-container">
        <span 
          className="post-reference"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          &gt;&gt;{postId.substring(0, 8)}
        </span>
      </span>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Referenced Post {postId.substring(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            This message is referring to the span component in file client/src/components/PostReference.tsx at line 42.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};