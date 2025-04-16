import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadMedia, MediaType } from "@/lib/nostr";
import { MediaContent, MediaUpload } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface MediaUploaderProps {
  onMediaUploaded: (media: MediaContent[]) => void;
  maxFiles?: number;
  acceptedTypes?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onMediaUploaded,
  maxFiles = 4,
  acceptedTypes = "image/*,video/*,audio/*,application/pdf,text/plain"
}) => {
  const [mediaUploads, setMediaUploads] = useState<MediaUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAcceptedTypeLabel = (): string => {
    if (acceptedTypes === "image/*") return "Images";
    if (acceptedTypes === "video/*") return "Videos";
    if (acceptedTypes === "audio/*") return "Audio";
    if (acceptedTypes === "application/pdf") return "PDFs";
    return "Files";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files).slice(0, maxFiles);
    const existingCount = mediaUploads.length;
    
    if (existingCount + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} files`,
        variant: "destructive",
      });
      return;
    }
    
    // Create new uploads
    const newUploads: MediaUpload[] = [];
    
    for (const file of selectedFiles) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
          variant: "destructive",
        });
        continue;
      }
      
      // Read the file as data URL
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      const upload: MediaUpload = {
        file,
        data: "",
        loading: true,
        error: undefined
      };
      
      newUploads.push(upload);
      
      // Get data URL
      reader.onload = () => {
        if (reader.result) {
          upload.data = reader.result.toString();
          setMediaUploads(current => [...current]);
        }
      };
      
      reader.onerror = () => {
        upload.loading = false;
        upload.error = "Failed to read file";
        setMediaUploads(current => [...current]);
      };
    }
    
    // Add the new uploads to state
    setMediaUploads(current => [...current, ...newUploads]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadSelectedFiles = async () => {
    const filesToUpload = mediaUploads.filter(upload => !upload.url && !upload.error);
    
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (upload) => {
        try {
          // Upload the file
          const result = await uploadMedia(
            upload.data,
            upload.file.name,
            upload.file.type
          );
          
          // Update the upload
          upload.loading = false;
          upload.url = result.url;
          upload.mediaContent = result;
          
          return upload;
        } catch (error) {
          upload.loading = false;
          upload.error = "Upload failed";
          console.error("Failed to upload file:", error);
          return upload;
        }
      });
      
      await Promise.all(uploadPromises);
      
      // Update state with all uploads
      setMediaUploads([...mediaUploads]);
      
      // Call the callback with all successfully uploaded media
      const successfulUploads = mediaUploads
        .filter(upload => upload.mediaContent)
        .map(upload => upload.mediaContent!);
      
      if (successfulUploads.length > 0) {
        onMediaUploaded(successfulUploads);
        
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${successfulUploads.length} file(s)`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload one or more files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = (index: number) => {
    const newUploads = [...mediaUploads];
    newUploads.splice(index, 1);
    setMediaUploads(newUploads);
  };

  const renderPreview = (upload: MediaUpload, index: number) => {
    const { file, data, loading, error } = upload;
    
    return (
      <div key={index} className="relative border border-black bg-white p-2 rounded-none overflow-hidden">
        {/* Preview based on file type */}
        <div className="mb-1">
          {file.type.startsWith('image/') ? (
            <img
              src={data}
              alt={file.name}
              className="max-h-32 max-w-full object-contain mx-auto"
            />
          ) : file.type.startsWith('video/') ? (
            <video
              src={data}
              controls
              className="max-h-32 max-w-full mx-auto"
            />
          ) : file.type.startsWith('audio/') ? (
            <audio
              src={data}
              controls
              className="max-w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-20 bg-gray-100">
              <div className="text-center">
                <div className="text-xl text-gray-500">
                  {file.type.includes('pdf') ? '📄' : '📎'}
                </div>
                <div className="text-xs text-gray-700 mt-1">{file.type}</div>
              </div>
            </div>
          )}
        </div>

        {/* File info */}
        <div className="text-xs truncate text-gray-700">{file.name}</div>
        <div className="text-xs text-gray-500">
          {(file.size / 1024).toFixed(1)} KB
        </div>

        {/* Status indicators */}
        {loading && !error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-xs animate-pulse">Loading...</div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
            <div className="text-white text-xs">{error}</div>
          </div>
        )}

        {/* Remove button */}
        <button
          type="button"
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white text-xs"
          onClick={() => removeUpload(index)}
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* File selector */}
      <div className="mb-2">
        <Button
          type="button"
          variant="outline"
          className="border-black rounded-none text-sm w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || mediaUploads.length >= maxFiles}
        >
          {isUploading ? (
            <span className="animate-pulse">Uploading...</span>
          ) : (
            `Add ${getAcceptedTypeLabel()} (${mediaUploads.length}/${maxFiles})`
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={isUploading || mediaUploads.length >= maxFiles}
        />
      </div>

      {/* Preview grid */}
      {mediaUploads.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {mediaUploads.map((upload, index) => renderPreview(upload, index))}
          </div>

          {/* Upload button */}
          {mediaUploads.some(upload => !upload.url && !upload.error) && (
            <Button
              type="button"
              className="bg-primary text-white rounded-none border border-black w-full"
              onClick={uploadSelectedFiles}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </Button>
          )}
        </>
      )}
    </div>
  );
};