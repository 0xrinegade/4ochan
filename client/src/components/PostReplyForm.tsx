import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/nostr";
import { apiRequest } from "@/lib/queryClient";
import { MediaUploader } from "@/components/MediaUploader";
import { MediaContent } from "@/types";
import { 
  ImageIcon, 
  PencilIcon, 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon, 
  CodeIcon,
  QuoteIcon,
  ListIcon,
  LinkIcon,
  Heading1Icon,
  SparklesIcon,
  ImageIcon as ImageEmbedIcon,
  Table2Icon,
  MusicIcon,
  SmileIcon,
  ClockIcon,
  MessageSquareQuote,
  FileText,
  EyeIcon,
  KeyboardIcon,
  UploadIcon,
  Sigma,
  PaletteIcon,
  EyeOffIcon
} from "lucide-react";
import { DrawingBoard } from "@/components/DrawingBoard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmojiPicker from 'emoji-picker-react';
import { PopoverContent, Popover, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [showDrawingBoard, setShowDrawingBoard] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showTemplates, setShowTemplates] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [hasKeyboardShortcuts, setHasKeyboardShortcuts] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
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
        description: "Your drawing has been added to your post.",
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
  
  // Handle pasting images from clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (isSubmitting || isProcessing || isUploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    let hasProcessedImage = false;
    
    setIsUploading(true);
    toast({
      title: "Processing clipboard content",
      description: "If you pasted an image, it will be uploaded automatically.",
    });
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle image paste
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent the default paste behavior for images
        
        try {
          const blob = item.getAsFile();
          if (!blob) continue;
          
          // Read the file as data URL
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          // Upload the image to Nostr
          const imageUrl = await uploadImage(dataUrl);
          
          // Create a media object for the pasted image
          const media: MediaContent = {
            id: `pasted-${Date.now()}`,
            url: imageUrl,
            type: 'image',
            name: `Pasted Image ${new Date().toLocaleTimeString()}`,
            size: blob.size,
          };
          
          // Add to uploaded media
          setUploadedMedia(prev => [...prev, media]);
          
          toast({
            title: "Image Pasted",
            description: "Your pasted image has been uploaded and will be included with your post.",
          });
          
          hasProcessedImage = true;
        } catch (error) {
          console.error("Error processing pasted image:", error);
          toast({
            title: "Image Paste Failed",
            description: "Failed to process the pasted image.",
            variant: "destructive",
          });
        }
      }
    }
    
    setIsUploading(false);
  }, [isSubmitting, isProcessing, isUploading, toast]);

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
        // Store the original message in case user wants to revert
        const originalMessage = replyText;
        
        // Update the text area with the enhanced message
        setReplyText(response.processedText);
        setProcessedText(response.processedText);
        setIsProcessed(true);
        
        // Show success message with option to revert
        toast({
          title: "Message Enhanced",
          description: 
            <div className="flex flex-col space-y-2">
              <span>Your message has been enhanced by GPT-4o!</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setReplyText(originalMessage)}
                className="text-xs"
              >
                Revert to original
              </Button>
            </div>,
          duration: 5000,
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

  // Format text with markdown
  const formatText = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = replyText.substring(start, end);
    
    let formattedText = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : 10;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : 12;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'underlined text'}</u>`;
        cursorOffset = selectedText ? 0 : 16;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? 0 : 5;
        break;
      case 'codeblock':
        formattedText = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        cursorOffset = selectedText ? 0 : 10;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'quoted text'}`;
        cursorOffset = selectedText ? 0 : 12;
        break;
      case 'list':
        formattedText = selectedText ? 
          selectedText.split('\n').map(line => `- ${line}`).join('\n') : 
          '- list item\n- another item';
        cursorOffset = selectedText ? 0 : 22;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? 0 : 16;
        break;
      case 'heading':
        formattedText = `# ${selectedText || 'Heading'}`;
        cursorOffset = selectedText ? 0 : 8;
        break;
      case 'image':
        formattedText = `![${selectedText || 'alt text'}](image-url)`;
        cursorOffset = selectedText ? 0 : 19;
        break;
      case 'mermaid':
        formattedText = `\`\`\`mermaid\ngraph TD\n    A[${selectedText || 'Start'}] --> B[End]\n\`\`\``;
        cursorOffset = selectedText ? 0 : 35;
        break;
      case 'table':
        formattedText = `| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Row 1, Col 1 | Row 1, Col 2 | Row 1, Col 3 |\n| Row 2, Col 1 | Row 2, Col 2 | Row 2, Col 3 |`;
        cursorOffset = 0;
        break;
      case 'music':
        formattedText = `🎵 ${selectedText || 'Musical notation or lyrics'} 🎵`;
        cursorOffset = selectedText ? 0 : 25;
        break;
      case 'color':
        formattedText = `<span style="color:${selectedColor}">${selectedText || `colored text`}</span>`;
        cursorOffset = selectedText ? 0 : 12;
        break;
      case 'spoiler':
        formattedText = `<details><summary>Spoiler</summary>${selectedText || 'Hidden content'}</details>`;
        cursorOffset = selectedText ? 0 : 15;
        break;
      case 'latex':
        formattedText = `$${selectedText || 'E = mc^2'}$`;
        cursorOffset = selectedText ? 0 : 10;
        break;
      case 'timestamp':
        const now = new Date();
        formattedText = `[${now.toLocaleString()}]`;
        cursorOffset = 0;
        break;
      case 'quote-reply':
        // This would require knowledge of what's being replied to
        formattedText = `> [Reply to previous message]\n> ${selectedText || 'Reply context goes here'}\n\n`;
        cursorOffset = selectedText ? 0 : 22;
        break;
      default:
        return;
    }
    
    // Update the text area value
    const newValue = replyText.substring(0, start) + formattedText + replyText.substring(end);
    setReplyText(newValue);
    
    // Update cursor position (after React has updated the DOM)
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + formattedText.length - cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Add emoji to the text
  const handleEmojiSelect = (emoji: { unified: string, emoji: string }) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert emoji at cursor position
    const newValue = replyText.substring(0, start) + emoji.emoji + replyText.substring(end);
    setReplyText(newValue);
    
    // Update cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + emoji.emoji.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    // Hide emoji picker after selection
    setShowEmojiPicker(false);
  };
  
  // Handle file dropping
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploading(true);
      const files = Array.from(e.dataTransfer.files);
      
      try {
        const uploadPromises = files.map(async (file) => {
          if (file.type.startsWith('image/')) {
            // Read the file as data URL
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            
            // Upload image
            const imageUrl = await uploadImage(dataUrl);
            
            // Create a media object for the dropped file
            const media: MediaContent = {
              id: `dropped-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              url: imageUrl,
              type: 'image',
              name: file.name,
              size: file.size,
            };
            
            return media;
          }
          return null;
        });
        
        const uploadedMedia = (await Promise.all(uploadPromises)).filter(Boolean);
        
        if (uploadedMedia.length > 0) {
          setUploadedMedia(prev => [...prev, ...uploadedMedia]);
          
          toast({
            title: "Files Uploaded",
            description: `${uploadedMedia.length} files have been uploaded and will be included with your post.`,
          });
        } else {
          toast({
            title: "No Valid Files",
            description: "No valid image files were found in the drop.",
          });
        }
      } catch (error) {
        console.error("Error processing dropped files:", error);
        toast({
          title: "Upload Failed",
          description: "Failed to process your dropped files.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // Add templated content
  const applyTemplate = (templateName: string) => {
    let templateContent = '';
    
    switch (templateName) {
      case 'introduction':
        templateContent = `## Hello everyone!\nI'm new here and wanted to introduce myself. I'm interested in [topic] and looking forward to engaging with this community!`;
        break;
      case 'question':
        templateContent = `## Question about [topic]\n\nI've been wondering about [question details]. Has anyone had experience with this?\n\nAny insights would be greatly appreciated!`;
        break;
      case 'analysis':
        templateContent = `# Analysis of [topic]\n\n## Background\n[Background information]\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n[Your conclusion]`;
        break;
      case 'event':
        templateContent = `# Event Announcement\n\n**Event:** [Event Name]\n**Date:** [Date]\n**Time:** [Time]\n**Location:** [Location]\n\n## Details\n[Event description]\n\n## How to Join\n[Instructions]`;
        break;
      default:
        return;
    }
    
    setReplyText(templateContent);
    setShowTemplates(false);
  };
  
  // Set up keyboard shortcuts
  useEffect(() => {
    if (!hasKeyboardShortcuts) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if ctrl/cmd key is pressed
      if (!e.ctrlKey && !e.metaKey) return;
      
      switch (e.key) {
        case 'b': // Bold
          e.preventDefault();
          formatText('bold');
          break;
        case 'i': // Italic
          e.preventDefault();
          formatText('italic');
          break;
        case 'k': // Link (common in many markdown editors)
          e.preventDefault();
          formatText('link');
          break;
        case 'e': // Emoji picker
          e.preventDefault();
          setShowEmojiPicker(prev => !prev);
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasKeyboardShortcuts, replyText]);
  
  // Add a rendered preview of the markdown content
  const previewContent = useMemo(() => {
    return replyText;
  }, [replyText]);
  
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
      setShowDrawingBoard(false);
      
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
    <form onSubmit={handleSubmit} className="border border-black p-3 bg-card">
      <div className="mb-2">
        <div className="text-sm font-bold mb-1 bg-primary text-white p-1">YOUR MESSAGE</div>
        <Textarea
          ref={textareaRef}
          value={replyText}
          onChange={(e) => {
            setReplyText(e.target.value);
          }}
          onPaste={handlePaste}
          placeholder="What's your response? Markdown and Mermaid diagrams supported. You can also paste images directly."
          rows={3}
          className="w-full p-2 border border-black rounded-none bg-background text-foreground text-sm font-mono"
          disabled={isSubmitting || isProcessing}
        />
      </div>
      
      {/* Formatting Options Toggle */}
      <div className="flex mb-2 space-x-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-black text-foreground hover:bg-accent rounded-none text-xs"
          onClick={() => setShowFormatOptions(!showFormatOptions)}
          disabled={isSubmitting}
        >
          {showFormatOptions ? "Hide Formatting Options" : "Show Formatting Options"}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-black bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-none text-xs"
                onClick={handleProcessClick}
                disabled={isSubmitting || isProcessing || !replyText.trim()}
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                Enhance with GPT-4o
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Process your message with OpenAI's GPT-4o to improve it</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Formatting Buttons */}
      {showFormatOptions && (
        <div className="mb-3 p-2 border border-black bg-background">
          <div className="text-xs font-bold mb-2">Formatting Options</div>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('bold')}
                  >
                    <BoldIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Bold</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('italic')}
                  >
                    <ItalicIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Italic</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('underline')}
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Underline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('code')}
                  >
                    <CodeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Inline Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('codeblock')}
                  >
                    <CodeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Code Block</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('quote')}
                  >
                    <QuoteIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Quote</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('list')}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">List</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('link')}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('heading')}
                  >
                    <Heading1Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Heading</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('mermaid')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16M4 12h16M4 18h12" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mermaid Diagram</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('table')}
                  >
                    <Table2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Markdown Table</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => formatText('music')}
                  >
                    <MusicIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Music Notes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">
            Select text and click a format button, or click button to insert template.
          </p>
        </div>
      )}
      
      {/* Media Uploader and Drawing Tool Toggles */}
      <div className="flex mb-2 space-x-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-black text-foreground hover:bg-accent rounded-none text-xs"
          onClick={() => setShowMediaUploader(!showMediaUploader)}
          disabled={isSubmitting}
        >
          {showMediaUploader ? "Hide Media Uploader" : `Add Media (Images, Video, Audio, Files)`}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-black text-foreground hover:bg-accent rounded-none text-xs"
          onClick={() => setShowDrawingBoard(!showDrawingBoard)}
          disabled={isSubmitting}
        >
          <PencilIcon className="h-3 w-3 mr-1" />
          {showDrawingBoard ? "Hide Drawing Tool" : "Open Drawing Tool"}
        </Button>
      </div>

      {/* Media Uploader */}
      {showMediaUploader && (
        <div className="mb-4 p-2 border border-black bg-background">
          <div className="text-xs font-bold mb-2">Upload Media Files</div>
          <MediaUploader 
            onMediaUploaded={handleMediaUploaded}
            maxFiles={4}
            acceptedTypes="image/*,video/*,audio/*,application/pdf,text/plain"
          />
        </div>
      )}
      
      {/* Drawing Board */}
      {showDrawingBoard && (
        <div className="mb-4">
          <DrawingBoard 
            onClose={() => setShowDrawingBoard(false)}
            onSaveDrawing={handleSaveDrawing}
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
            className="flex items-center text-foreground hover:text-primary border-black rounded-none text-xs"
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
          <span className="text-xs text-muted-foreground ml-2">
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

      
    </form>
  );
};
