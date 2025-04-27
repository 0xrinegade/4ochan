import { useState, useEffect } from 'react';

interface MobileDetectionResult {
  isMobile: boolean;
  isPwa: boolean;
  isMobilePwa: boolean;
}

export function useMobileDetection(): MobileDetectionResult {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isPwa, setIsPwa] = useState<boolean>(false);
  const [isMobilePwa, setIsMobilePwa] = useState<boolean>(false);

  useEffect(() => {
    // Check if device is mobile based on screen width
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Update mobile PWA status
      setIsMobilePwa(mobile && isPwa);
    };

    // Check if app is running as PWA (in standalone mode)
    const checkPwa = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      
      setIsPwa(standalone);
      
      // Update mobile PWA status
      setIsMobilePwa(isMobile && standalone);
    };

    // Initial checks
    checkMobile();
    checkPwa();

    // Add listeners for changes
    window.addEventListener('resize', checkMobile);
    
    // Media query for standalone display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPwa);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', checkPwa);
    };
  }, [isMobile, isPwa]);

  return { isMobile, isPwa, isMobilePwa };
}