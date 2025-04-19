import React, { useCallback, useState } from 'react';
import { Tldraw, Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DrawingBoardProps {
  onClose: () => void;
  onSaveDrawing?: (imageDataUrl: string) => void;
  className?: string;
}

export const DrawingBoard: React.FC<DrawingBoardProps> = ({ 
  onClose, 
  onSaveDrawing,
  className = '' 
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSaveDrawing = useCallback(async () => {
    if (!editor || !onSaveDrawing) return;

    try {
      // Get selected shape IDs or use all shapes
      const selectedIds = editor.getSelectedShapeIds();
      
      // Export the current drawing as an SVG
      const svg = await editor.getSvg(
        selectedIds.length > 0 ? selectedIds : undefined
      );

      if (svg) {
        // Convert SVG to a data URL
        const svgBlob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        // Create an image from the SVG
        const img = new Image();
        img.onload = () => {
          // Create a canvas and draw the image on it
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            // Convert to data URL and pass to parent
            const dataUrl = canvas.toDataURL('image/png');
            onSaveDrawing(dataUrl);
            URL.revokeObjectURL(url);
          }
        };
        img.src = url;
      }
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  }, [editor, onSaveDrawing]);

  return (
    <div className={`drawing-board-container relative h-[500px] border border-border rounded-md overflow-hidden ${className}`}>
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        {onSaveDrawing && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleSaveDrawing}
          >
            Save Drawing
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="bg-background/80"
        >
          <X size={16} />
        </Button>
      </div>
      
      <div className="w-full h-full">
        <Tldraw
          onMount={handleMount}
        />
      </div>
    </div>
  );
};