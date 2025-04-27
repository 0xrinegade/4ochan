import React, { ReactNode } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import MobileNavigation from './MobileNavigation';
import MobileHeader from './MobileHeader';

interface MobileWrapperProps {
  children: ReactNode;
}

/**
 * The MobileWrapper component conditionally applies mobile-specific UI
 * when the application is running as a PWA on a mobile device.
 */
const MobileWrapper: React.FC<MobileWrapperProps> = ({ children }) => {
  const { isMobile, isPwa, isMobilePwa } = useMobileDetection();
  
  // Only apply mobile-specific UI when in mobile PWA mode
  // Note: For now we're applying it to all mobile views for development; 
  // change this line to "if (isMobilePwa)" to restrict to PWA-only
  if (isMobile) {
    return (
      <div className="mobile-pwa-layout flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 pb-20">
          {children}
        </main>
        <MobileNavigation />
      </div>
    );
  }
  
  // Return children as-is for desktop layout
  return <>{children}</>;
};

export default MobileWrapper;