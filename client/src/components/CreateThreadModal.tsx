import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/nostr";
import { apiRequest } from "@/lib/queryClient";

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
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
    await processWithGPT(content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission if there's no processed text
    if (!isProcessed || !processedContent.trim()) {
      toast({
        title: "Processing Required",
        description: "Please write your message and click 'Process with AI' first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
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
            description: "Failed to upload the image. Your thread will be posted without the image.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      // Create the thread with processed content
      await onCreateThread(title, processedContent, imageUrls);
      
      // Reset form
      setTitle("");
      setContent("");
      setProcessedContent("");
      setIsProcessed(false);
      setSelectedFile(null);
      
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
      <DialogContent className="sm:max-w-lg bg-[#f5f5dc] border-2 border-black p-0 rounded-none shadow-none">
        <DialogHeader className="bg-primary text-white p-2 border-b-2 border-black">
          <DialogTitle className="text-base font-bold">Create New Thread in /{boardShortName}/</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="bg-[#f5f5dc]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="font-bold text-black">Subject (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread subject"
                className="mt-1 border-black rounded-none bg-white"
              />
            </div>
            
            <div>
              <Label htmlFor="content" className="font-bold text-black">YOUR MESSAGE</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  // Reset processed state when user edits the text
                  if (isProcessed) {
                    setIsProcessed(false);
                  }
                }}
                placeholder="Write your message here... AI will process it before posting!"
                rows={4}
                className="mt-1 border-black rounded-none bg-white font-mono text-sm p-2"
                required
                disabled={isProcessing || isSubmitting}
              />
            </div>
            
            {/* AI Processing Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleProcessClick}
                className="bg-[#8b0000] hover:bg-[#6b0000] text-white text-sm border border-black rounded-none w-full"
                disabled={isProcessing || isSubmitting || !content.trim()}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-pulse">AI is processing...</span>
                  </>
                ) : (
                  "Process with GPT-4o"
                )}
              </Button>
            </div>
            
            {/* AI Processed Text Section */}
            {(isProcessed || processedContent) && (
              <div className="border border-black p-2 bg-white">
                <div className="text-sm font-bold mb-1 bg-primary text-white p-1">
                  AI-PROCESSED MESSAGE (THIS WILL BE POSTED)
                </div>
                <div className="p-2 min-h-[60px] text-sm font-mono whitespace-pre-wrap">
                  {processedContent || "⌛ Waiting for AI to process your message..."}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="image" className="font-bold text-black">Image</Label>
              <div className="flex items-center mt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="flex items-center border-black rounded-none"
                >
                  <span className="text-xs">Add Image</span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="ml-3 text-xs text-gray-700">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <div className="text-xs text-gray-700 italic max-w-xs">
                Your message will be processed by GPT-4o before posting. The AI might suggest a title based on your content.
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
                  disabled={isSubmitting || isUploading || !isProcessed}
                >
                  {(isSubmitting || isUploading) ? (
                    <>
                      {isUploading ? "Uploading..." : "Creating..."}
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
