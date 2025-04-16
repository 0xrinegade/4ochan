import React from "react";
import { MediaContent } from "@/types";

interface MediaDisplayProps {
  media: MediaContent;
  size?: 'small' | 'medium' | 'large' | 'full';
  className?: string;
}

export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  size = 'medium',
  className = '',
}) => {
  // Determine size classes based on the size prop
  const sizeClasses = {
    small: 'max-h-24 max-w-xs',
    medium: 'max-h-64 max-w-md',
    large: 'max-h-96 max-w-lg',
    full: 'max-w-full',
  }[size];

  // Common CSS classes
  const commonClasses = `${sizeClasses} border border-gray-200 ${className}`;

  // Get file name and extension for display
  const fileName = media.name || 'file';
  const fileExtension = media.url.split('.').pop()?.toLowerCase() || '';

  // Render based on media type
  switch (media.type) {
    case 'image':
      return (
        <div className="media-container">
          <img
            src={media.url}
            alt={fileName}
            className={`object-contain ${commonClasses}`}
            loading="lazy"
          />
          {size === 'small' && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              {fileName}
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="media-container">
          <video
            src={media.url}
            controls
            className={commonClasses}
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
          <div className="text-xs text-gray-500 mt-1 truncate">
            {fileName}
          </div>
        </div>
      );

    case 'audio':
      return (
        <div className="media-container bg-gray-50 p-2 border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-xl">🎵</div>
            <div className="flex-1 truncate">
              <div className="text-sm font-medium truncate">{fileName}</div>
              <div className="text-xs text-gray-500">{media.mimeType}</div>
            </div>
          </div>
          <audio
            src={media.url}
            controls
            className="w-full mt-2"
            preload="metadata"
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      );

    case 'document':
      // For documents, display an icon and link
      let icon = '📄';
      if (fileExtension === 'pdf') icon = '📕';
      else if (['doc', 'docx'].includes(fileExtension)) icon = '📘';
      else if (['xls', 'xlsx'].includes(fileExtension)) icon = '📗';
      else if (['ppt', 'pptx'].includes(fileExtension)) icon = '📙';
      else if (['zip', 'rar', '7z'].includes(fileExtension)) icon = '🗜️';
      else if (['txt', 'md'].includes(fileExtension)) icon = '📝';

      return (
        <div className="media-container">
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start space-x-2 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
          >
            <div className="text-2xl">{icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{fileName}</div>
              <div className="text-xs text-gray-500">
                {media.size ? `${(media.size / 1024).toFixed(1)} KB` : ''}
                {media.mimeType && ` • ${media.mimeType.split('/')[1]}`}
              </div>
            </div>
          </a>
        </div>
      );

    default:
      // Default case - just show a link
      return (
        <div className="media-container">
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {fileName || 'Attachment'}
          </a>
        </div>
      );
  }
};

interface MediaGalleryProps {
  mediaList: MediaContent[];
  size?: 'small' | 'medium' | 'large' | 'full';
  className?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  mediaList,
  size = 'medium',
  className = '',
}) => {
  if (!mediaList || mediaList.length === 0) {
    return null;
  }

  // For a single media item, just display it normally
  if (mediaList.length === 1) {
    return <MediaDisplay media={mediaList[0]} size={size} className={className} />;
  }

  // Determine layout based on number of items
  return (
    <div className={`media-gallery grid gap-2 ${className}`} style={{ 
      gridTemplateColumns: mediaList.length > 3 ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)' 
    }}>
      {mediaList.map((media, index) => (
        <MediaDisplay
          key={index}
          media={media}
          size={size === 'full' ? 'medium' : 'small'}
        />
      ))}
    </div>
  );
};