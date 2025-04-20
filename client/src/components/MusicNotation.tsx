import React, { useState, useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';

interface MusicNotationProps {
  musicXml: string;
  isDarkMode: boolean;
}

// MusicNotation component for rendering sheet music with OpenSheetMusicDisplay
const MusicNotation: React.FC<MusicNotationProps> = ({ musicXml, isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear the container first
    containerRef.current.innerHTML = '';
    setIsLoading(true);
    
    try {
      // Create a div element for the OpenSheetMusicDisplay instance
      const osmdContainer = document.createElement('div');
      osmdContainer.className = 'osmd-container';
      containerRef.current.appendChild(osmdContainer);
      
      // Initialize OpenSheetMusicDisplay
      const osmd = new OpenSheetMusicDisplay(osmdContainer, {
        autoResize: true,
        drawTitle: true,
        drawSubtitle: true,
        drawComposer: true,
        drawLyricist: true,
        drawCredits: true,
        drawPartNames: true,
        // Adjust appearance based on dark mode
        coloringMode: isDarkMode ? 2 : 0, // 0: standard (black), 1: custom, 2: dark mode (white)
        // These properties might be available in future versions
        // For now they're not typed in the interface, but we can use them if needed in future
        // setCustomColorDark: isDarkMode ? '#DDDDDD' : undefined,
        // setCustomColorLight: isDarkMode ? '#999999' : undefined,
      });
      
      // Function to check if the input is XML or a URL
      const isXml = (input: string): boolean => {
        return input.trim().startsWith('<?xml') || input.trim().startsWith('<score-partwise');
      };
      
      // Load the music XML with sanitization
      if (isXml(musicXml)) {
        // It's direct XML content - sanitize it first
        // Use sanitization to remove potentially malicious elements
        const sanitizedXml = DOMPurify.sanitize(musicXml, {
          WHOLE_DOCUMENT: true,
          ADD_TAGS: ['score-partwise', 'part-list', 'score-part', 'part', 'measure', 'attributes', 'note'],
          ADD_ATTR: ['id', 'number', 'type', 'value', 'default-x', 'default-y'],
          RETURN_DOM: false,
          RETURN_DOM_FRAGMENT: false
        });
        
        osmd.load(sanitizedXml)
          .then(() => {
            osmd.render();
            setIsLoading(false);
            setError(null);
          })
          .catch(err => {
            console.error('Error rendering music notation:', err);
            setError(`Failed to render music notation: ${err.message}`);
            setIsLoading(false);
          });
      } else {
        // Assume it's a URL or a base64 encoded string
        try {
          // Check if it's a URL
          new URL(musicXml);
          
          // It's a URL, fetch it
          osmd.load(musicXml)
            .then(() => {
              osmd.render();
              setIsLoading(false);
              setError(null);
            })
            .catch(err => {
              console.error('Error loading music notation from URL:', err);
              setError(`Failed to load music notation from URL: ${err.message}`);
              setIsLoading(false);
            });
        } catch (urlError) {
          // Not a URL, try to handle it as base64
          try {
            // Assuming base64 encoded XML
            const decoded = atob(musicXml.replace(/^data:.*;base64,/, ''));
            
            // Sanitize the decoded XML
            const sanitizedXml = DOMPurify.sanitize(decoded, {
              WHOLE_DOCUMENT: true,
              ADD_TAGS: ['score-partwise', 'part-list', 'score-part', 'part', 'measure', 'attributes', 'note'],
              ADD_ATTR: ['id', 'number', 'type', 'value', 'default-x', 'default-y'],
              RETURN_DOM: false,
              RETURN_DOM_FRAGMENT: false
            });
            
            osmd.load(sanitizedXml)
              .then(() => {
                osmd.render();
                setIsLoading(false);
                setError(null);
              })
              .catch(err => {
                console.error('Error loading music notation from decoded content:', err);
                setError(`Failed to load music notation: ${err.message}`);
                setIsLoading(false);
              });
          } catch (decodeError) {
            console.error('Error decoding music notation:', decodeError);
            setError('Failed to decode music notation data');
            setIsLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.error('Error initializing OpenSheetMusicDisplay:', err);
      setError(`Failed to initialize music display: ${err.message}`);
      setIsLoading(false);
    }
  }, [musicXml, isDarkMode]);
  
  return (
    <div className="music-notation-container">
      <div className="music-notation-header">
        <div className="music-notation-title">Sheet Music</div>
        <div className="music-notation-action-buttons">
          {/* Download button for the MusicXML */}
          <button 
            className="music-notation-action-button text-primary-foreground" 
            title="Download MusicXML" 
            onClick={() => {
              const blob = new Blob([musicXml], { type: 'application/vnd.recordare.musicxml+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sheet-music.xml';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Download
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="music-notation-loading">
          <div className="music-notation-loading-spinner"></div>
          <p>Loading sheet music...</p>
        </div>
      )}
      
      {error && (
        <div className="music-notation-error">
          <p className="text-destructive-foreground">Error rendering sheet music:</p>
          <pre className="text-destructive-foreground">{error}</pre>
          <SyntaxHighlighter
            style={isDarkMode ? vscDarkPlus : vs}
            language="xml"
            PreTag="div"
          >
            {musicXml.length > 500 ? `${musicXml.substring(0, 500)}...` : musicXml}
          </SyntaxHighlighter>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className={`music-notation-display ${isLoading ? 'loading' : ''}`}
        style={{ minHeight: '300px', width: '100%' }}
      ></div>
    </div>
  );
};

export default MusicNotation;