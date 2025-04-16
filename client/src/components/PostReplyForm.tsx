import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/nostr";

interface PostReplyFormProps {
  onSubmitReply: (content: string, imageUrls: string[]) => Promise<void>;
}

export const PostReplyForm: React.FC<PostReplyFormProps> = ({ onSubmitReply }) => {
  const [replyText, setReplyText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
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
            description: "Failed to upload the image. Your reply will be posted without the image.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      // Submit the reply
      await onSubmitReply(replyText, imageUrls);
      
      // Reset form
      setReplyText("");
      setSelectedFile(null);
      
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
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply..."
          rows={4}
          className="w-full p-2 border border-gray-300 rounded text-sm"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-primary mr-4"
            onClick={() => document.getElementById("reply-image-upload")?.click()}
            disabled={isSubmitting}
          >
            <i className="fas fa-image mr-1"></i>
            <span className="text-sm">Add Image</span>
          </Button>
          <input
            id="reply-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSubmitting}
          />
          <span className="text-xs text-gray-500">
            {selectedFile ? selectedFile.name : "No file selected"}
          </span>
        </div>
        <Button
          type="submit"
          className="bg-primary hover:bg-blue-800 text-white text-sm"
          disabled={isSubmitting || isUploading}
        >
          {(isSubmitting || isUploading) ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>
              {isUploading ? "Uploading..." : "Posting..."}
            </>
          ) : (
            "Post Reply"
          )}
        </Button>
      </div>
    </form>
  );
};
