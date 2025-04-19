import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Fixed navigation buttons that are always visible on screen
 * regardless of scroll position or page content
 */
export const FloatingNavigation: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div 
         style={{ 
           position: 'fixed', 
           right: '24px', 
           bottom: '96px',
           zIndex: 9999,
           pointerEvents: 'auto',
           display: 'flex',
           flexDirection: 'column',
           gap: '16px',
           isolation: 'isolate', // Ensures the container is rendered on its own stacking context
           filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' // Add a drop shadow for visibility
         }}>
      
      {/* Bottom scroll button */}
      <Button
        onClick={scrollToBottom}
        style={{
          width: '50px',
          height: '50px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FF6B00', // Bright orange
          color: 'white',
          borderRadius: '50%',
          border: '3px solid black',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        variant="default"
        title="Scroll to bottom"
      >
        <ArrowDown size={24} />
      </Button>
      
      {/* Top scroll button */}
      <Button
        onClick={scrollToTop}
        style={{
          width: '50px',
          height: '50px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FF6B00', // Bright orange
          color: 'white',
          borderRadius: '50%',
          border: '3px solid black',
          boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        variant="default"
        title="Scroll to top"
      >
        <ArrowUp size={24} />
      </Button>
    </div>
  );
};

export default FloatingNavigation;