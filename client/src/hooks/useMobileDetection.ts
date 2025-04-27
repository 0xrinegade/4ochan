import { useState, useEffect } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;      // Is the device a mobile device (based on screen size or user agent)
  isPwa: boolean;         // Is the app running in PWA mode (installed)
  isMobilePwa: boolean;   // Is the app a mobile PWA (combination of isMobile && isPwa)
  width: number;          // Current window width
  height: number;         // Current window height
}

/**
 * Hook to detect if the application is running on a mobile device and/or as an installed PWA
 */
export const useMobileDetection = (): MobileDetectionResult => {
  // Set initial state
  const [state, setState] = useState<MobileDetectionResult>({
    isMobile: false,
    isPwa: false,
    isMobilePwa: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Function to check mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      
      // Check screen width (most reliable way for layout purposes)
      const screenWidth = window.innerWidth;
      const isMobileScreenSize = screenWidth < 768;
      
      // Check user agent for mobile devices
      const isMobileDevice = mobileRegex.test(userAgent);
      
      return isMobileScreenSize || isMobileDevice;
    };

    // Function to check if running as PWA
    const checkPwa = () => {
      // Check if app is in standalone mode (installed PWA)
      // or displayed with minimum-ui (iOS home screen)
      const displayMode = 
        // @ts-ignore: Safari on iOS exposes this non-standard property
        (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;
        
      return displayMode;
    };

    // Function to update state
    const updateState = () => {
      const isMobile = checkMobile();
      const isPwa = checkPwa();
      
      setState({
        isMobile,
        isPwa,
        isMobilePwa: isMobile && isPwa,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Update on mount
    updateState();

    // Add resize listener
    window.addEventListener('resize', updateState);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateState);
    };
  }, []);

  return state;
};

export default useMobileDetection;