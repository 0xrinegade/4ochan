import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/nostr";
import { apiRequest } from "@/lib/queryClient";
import { PencilIcon } from "lucide-react";
import { DrawingBoard } from "@/components/DrawingBoard";
import { MediaContent } from "@/types";

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateThread: (title: string, content: string, imageUrls: string[]) => Promise<void>;
  boardShortName?: string;
}

interface GPTProcessResponse {
  success: boolean;
  message?: string;
  originalText: string;
  processedText: string;
  sentiment?: number;
  topics?: string[];
}

export const CreateThreadModal: React.FC<CreateThreadModalProps> = ({
  isOpen,
  onClose,
  onCreateThread,
  boardShortName = "",
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [processedContent, setProcessedContent] = useState("");
  const [isProcessed, setIsProcessed] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaContent[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDrawingBoard, setShowDrawingBoard] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleSaveDrawing = async (imageDataUrl: string) => {
    try {
      setIsUploading(true);
      toast({
        title: "Uploading Drawing",
        description: "Your drawing is being uploaded...",
      });
      
      // Upload the drawing to Nostr
      const imageUrl = await uploadImage(imageDataUrl);
      
      // Create a media object for the drawing
      const media: MediaContent = {
        id: `drawing-${Date.now()}`,
        url: imageUrl,
        type: 'image',
        name: `Drawing ${new Date().toLocaleTimeString()}`,
        size: Math.round(imageDataUrl.length * 0.75), // Approximate size calculation
      };
      
      // Add to uploaded media
      setUploadedMedia(prev => [...prev, media]);
      
      // Close drawing board
      setShowDrawingBoard(false);
      
      toast({
        title: "Drawing Uploaded",
        description: "Your drawing has been added to your thread.",
      });
    } catch (error) {
      console.error("Error uploading drawing:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your drawing.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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
          context: `This is a new thread in /${boardShortName}/ with title: ${title || "Untitled"}`,
        }
      });

      if (response.success) {
        setProcessedContent(response.processedText);
        setIsProcessed(true);
        
        // If we got topics and there's no title yet, suggest one
        if (response.topics && response.topics.length > 0 && !title.trim()) {
          setTitle(response.topics[0].charAt(0).toUpperCase() + response.topics[0].slice(1));
        }
        
        // Show success message
        toast({
          title: "Message Ready",
          description: "Your message is ready to post.",
        });
        
        return true;
      } else {
        toast({
          title: "Processing Failed",
          description: response.message || "Failed to process your message",
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
    await processWithGPT(content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there's content to process
    if (!content.trim()) {
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
      let finalContent = content;
      
      try {
        // Send to GPT-In-The-Middle API without showing UI for it
        const response = await apiRequest<GPTProcessResponse>({
          method: "POST",
          url: "/api/gpt-process",
          data: {
            userInput: content,
            context: `This is a new thread in /${boardShortName}/ with title: ${title || "Untitled"}`,
          }
        });

        if (response.success) {
          finalContent = response.processedText;
          
          // If we got topics and there's no title yet, suggest one
          if (response.topics && response.topics.length > 0 && !title.trim()) {
            setTitle(response.topics[0].charAt(0).toUpperCase() + response.topics[0].slice(1));
          }
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
      
      // First include any drawing images that were already uploaded
      uploadedMedia.forEach(media => {
        if (media.type === 'image' && media.url) {
          imageUrls.push(media.url);
        }
      });
      
      // Then handle traditional file upload if selected
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
            description: "Failed to upload the image. Your thread will be posted without the image.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      // Create the thread with processed content
      await onCreateThread(title, finalContent, imageUrls);
      
      // Reset form
      setTitle("");
      setContent("");
      setProcessedContent("");
      setIsProcessed(false);
      setSelectedFile(null);
      setUploadedMedia([]);
      setShowDrawingBoard(false);
      
      // Close modal
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create thread",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-2 border-black p-0 rounded-none shadow-none">
        <DialogHeader className="bg-primary text-white p-2 border-b-2 border-black">
          <DialogTitle className="text-base font-bold">Create New Thread in /{boardShortName}/</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="bg-card">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="font-bold text-foreground">Subject (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread subject"
                className="mt-1 border-black rounded-none bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="content" className="font-bold text-foreground">YOUR MESSAGE</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
                placeholder="What do you want to discuss? Markdown and Mermaid diagrams supported."
                rows={4}
                className="mt-1 border-black rounded-none bg-white font-mono text-sm p-2"
                required
                disabled={isProcessing || isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="image" className="font-bold text-foreground">Images & Media</Label>
              <div className="flex items-center mt-1 space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="flex items-center border-black rounded-none"
                >
                  <span className="text-xs">Add Image</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDrawingBoard(!showDrawingBoard)}
                  className="flex items-center border-black rounded-none"
                >
                  <PencilIcon className="h-3 w-3 mr-1" />
                  <span className="text-xs">{showDrawingBoard ? "Hide Drawing Tool" : "Open Drawing Tool"}</span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="text-xs text-muted-foreground ml-2">
                  {selectedFile ? selectedFile.name : ""}
                  {uploadedMedia.length > 0 && !selectedFile && `${uploadedMedia.length} drawing(s) attached`}
                </span>
              </div>
              
              {/* Drawing Board */}
              {showDrawingBoard && (
                <div className="mt-2">
                  <DrawingBoard 
                    onClose={() => setShowDrawingBoard(false)}
                    onSaveDrawing={handleSaveDrawing}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <div className="text-xs text-muted-foreground italic max-w-xs">
                A title may be suggested based on your message content if you leave the subject field empty.
              </div>
              
              <div className="flex">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="mr-2 border-black rounded-none"
                  disabled={isSubmitting || isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-[#6b0000] text-white border border-black rounded-none"
                  disabled={isSubmitting || isUploading || !content.trim()}
                >
                  {(isSubmitting || isUploading || isProcessing) ? (
                    <>
                      {isUploading ? "Uploading..." : isProcessing ? "Processing..." : "Creating..."}
                    </>
                  ) : (
                    "Create Thread"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
