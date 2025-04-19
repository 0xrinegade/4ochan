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
    // Close the modal when mouse leaves
    setShowModal(false);
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
        <DialogContent className="sm:max-w-[425px] retro-dialog">
          <DialogHeader className="retro-dialog-header">
            <DialogTitle className="retro-dialog-title">Referenced Post {postId.substring(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-black">
            <p>This message is referring to the span component in file client/src/components/PostReference.tsx at line 42.</p>
            <p className="mt-2 font-mono text-sm">Displayed when hovering over &gt;&gt;{postId.substring(0, 8)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};