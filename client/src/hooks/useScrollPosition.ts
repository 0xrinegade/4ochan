import { useState, useEffect } from 'react';

interface ScrollPosition {
  y: number;
  direction: 'up' | 'down' | 'none';
  isScrolling: boolean;
  isAtTop: boolean;
}

export function useScrollPosition(scrollThreshold = 10, idleDelay = 1000): ScrollPosition {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    y: 0,
    direction: 'none',
    isScrolling: false,
    isAtTop: true
  });
  
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      let direction: 'up' | 'down' | 'none' = 'none';
      if (currentScrollY > lastScrollY + scrollThreshold) {
        direction = 'down';
      } else if (currentScrollY < lastScrollY - scrollThreshold) {
        direction = 'up';
      } else {
        direction = scrollPosition.direction;
      }
      
      // Update scrolling status
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      // Set a new timeout for detecting when scrolling stops
      const newTimer = setTimeout(() => {
        setScrollPosition(prev => ({
          ...prev,
          isScrolling: false
        }));
      }, idleDelay);
      
      setScrollTimer(newTimer);
      setLastScrollY(currentScrollY);
      
      setScrollPosition({
        y: currentScrollY,
        direction,
        isScrolling: true,
        isAtTop: currentScrollY < 10
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [lastScrollY, scrollThreshold, idleDelay, scrollTimer, scrollPosition.direction]);
  
  return scrollPosition;
}