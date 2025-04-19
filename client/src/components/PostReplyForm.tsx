import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/nostr";
import { apiRequest } from "@/lib/queryClient";
import { MediaUploader } from "@/components/MediaUploader";
import { MediaContent } from "@/types";

interface PostReplyFormProps {
  onSubmitReply: (content: string, imageUrls: string[], media?: MediaContent[]) => Promise<void>;
  threadId?: string;
}

interface GPTProcessResponse {
  success: boolean;
  message?: string;
  originalText: string;
  processedText: string;
  sentiment?: number;
  topics?: string[];
}

export const PostReplyForm: React.FC<PostReplyFormProps> = ({ onSubmitReply, threadId }) => {
  const [replyText, setReplyText] = useState("");
  const [processedText, setProcessedText] = useState("");
  const [isProcessed, setIsProcessed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For legacy support
  const [uploadedMedia, setUploadedMedia] = useState<MediaContent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const { toast } = useToast();

  // Legacy file upload handler (for backward compatibility)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleMediaUploaded = (media: MediaContent[]) => {
    setUploadedMedia(media);
  };

  const processWithGPT = async (userInput: string) => {
    if (!userInput.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);

    try {
      // Send to GPT-In-The-Middle API
      const response = await apiRequest<GPTProcessResponse>({
        method: "POST",
        url: "/api/gpt-process",
        data: {
          userInput,
          threadId,
          context: `This is a message in thread #${threadId || 'unknown'}`
        }
      });

      if (response.success) {
        setProcessedText(response.processedText);
        setIsProcessed(true);
        
        // Show success message
        toast({
          title: "AI Processing Complete",
          description: "Your message has been processed by GPT-4o. Review and post!",
        });
        
        return true;
      } else {
        toast({
          title: "Processing Failed",
          description: response.message || "Failed to process your message with AI",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Error processing with GPT:", error);
      toast({
        title: "Processing Error",
        description: error.message || "An error occurred while processing your message",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await processWithGPT(replyText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there's content to process
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setIsProcessing(true);
      
      // First, silently process with GPT-4o
      let finalContent = replyText;
      
      try {
        // Send to GPT-In-The-Middle API without showing UI for it
        const response = await apiRequest<GPTProcessResponse>({
          method: "POST",
          url: "/api/gpt-process",
          data: {
            userInput: replyText,
            threadId,
            context: `This is a message in thread #${threadId || 'unknown'}`
          }
        });

        if (response.success) {
          finalContent = response.processedText;
        } else {
          console.error("GPT processing failed silently:", response.message);
          // Continue with original content if processing fails
        }
      } catch (error) {
        console.error("Error in silent GPT processing:", error);
        // Continue with original content if processing fails
      } finally {
        setIsProcessing(false);
      }
      
      // Handle image upload if selected
      let imageUrls: string[] = [];
      
      if (selectedFile) {
        setIsUploading(true);
        
        try {
          // Convert file to data URL
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
          
          // Upload image and get URL
          const uploadedUrl = await uploadImage(dataUrl);
          imageUrls.push(uploadedUrl);
        } catch (error) {
          toast({
            title: "Image Upload Failed",
            description: "Failed to upload the image. Your reply will be posted without the image.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      // Submit the processed reply with both legacy image URLs and new media
      await onSubmitReply(finalContent, imageUrls, uploadedMedia);
      
      // Reset form
      setReplyText("");
      setProcessedText("");
      setIsProcessed(false);
      setSelectedFile(null);
      setUploadedMedia([]);
      setShowMediaUploader(false);
      
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-black p-3 bg-[#f5f5dc]">
      <div className="mb-2">
        <div className="text-sm font-bold mb-1 bg-primary text-white p-1">YOUR MESSAGE</div>
        <Textarea
          value={replyText}
          onChange={(e) => {
            setReplyText(e.target.value);
          }}
          placeholder="What's your response? (Your message will be enhanced by AI)"
          rows={3}
          className="w-full p-2 border border-black rounded-none bg-white text-sm font-mono"
          disabled={isSubmitting || isProcessing}
        />
      </div>
      
      {/* Media Uploader Toggle */}
      <div className="mb-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border-black text-black hover:bg-gray-100 rounded-none text-xs"
          onClick={() => setShowMediaUploader(!showMediaUploader)}
          disabled={isSubmitting}
        >
          {showMediaUploader ? "Hide Media Uploader" : `Add Media (Images, Video, Audio, Files)`}
        </Button>
      </div>

      {/* Media Uploader */}
      {showMediaUploader && (
        <div className="mb-4 p-2 border border-black bg-white">
          <div className="text-xs font-bold mb-2">Upload Media Files</div>
          <MediaUploader 
            onMediaUploaded={handleMediaUploaded}
            maxFiles={4}
            acceptedTypes="image/*,video/*,audio/*,application/pdf,text/plain"
          />
        </div>
      )}
      
      {/* Legacy Image Uploader (for backward compatibility) */}
      <div className="flex items-center justify-between mb-2 mt-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center text-black hover:text-primary border-black rounded-none text-xs"
            onClick={() => document.getElementById("reply-image-upload")?.click()}
            disabled={isSubmitting}
          >
            <span className="text-xs">Add Single Image</span>
          </Button>
          <input
            id="reply-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
          <span className="text-xs text-gray-700 ml-2">
            {selectedFile ? selectedFile.name : ""}
          </span>
        </div>
        <Button
          type="submit"
          className="bg-primary hover:bg-[#6b0000] text-white text-sm border border-black rounded-none"
          disabled={isSubmitting || isUploading || !replyText.trim()}
        >
          {(isSubmitting || isUploading || isProcessing) ? (
            <>
              {isUploading ? "Uploading..." : isProcessing ? "Processing..." : "Posting..."}
            </>
          ) : (
            "Post Reply"
          )}
        </Button>
      </div>

      <div className="mt-2 text-xs text-center text-gray-700 italic">
        Your message will be processed by GPT-4o before posting. The AI will make it more engaging while preserving your intent.
      </div>
    </form>
  );
};
