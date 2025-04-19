import React, { useState, useEffect } from 'react';
import { Download, X, Info, ArrowRight, Menu, MoreVertical, Share, Plus } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

const PwaInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isPwaInstalled,
    installPwa,
    browserType,
    isIos,
    isStandalone
  } = usePwaInstall();

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [expandedInstructions, setExpandedInstructions] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if the banner has been dismissed recently
    const dismissedTime = localStorage.getItem('pwa-banner-dismissed');
    const isDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime)) < (7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Only show the banner if it's installable, not already installed, and not dismissed
    const shouldShow = (isInstallable || isIos) && !isPwaInstalled && !isDismissed && !isStandalone;
    
    // Add a small delay for better UX
    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isPwaInstalled, isIos, isStandalone]);

  const dismissBanner = () => {
    setIsVisible(false);
    setDismissed(true);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // If banner is dismissed or app is already installed, don't render
  if (dismissed || !isVisible || isStandalone || isPwaInstalled) {
    return null;
  }

  const renderBrowserSpecificInstructions = () => {
    if (!expandedInstructions) return null;

    switch (browserType) {
      case 'chrome':
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Chrome instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the menu button <Menu className="inline h-3 w-3" /> in the top-right corner</li>
              <li>Select "Install 4ochan.org..." or "Install app"</li>
              <li>Follow the on-screen instructions</li>
            </ol>
          </div>
        );
      case 'firefox':
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Firefox instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the menu button <MoreVertical className="inline h-3 w-3" /> in the top-right</li>
              <li>Select "Install" or "Add to Home screen"</li>
              <li>Follow the on-screen instructions</li>
            </ol>
          </div>
        );
      case 'safari':
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Safari instructions (iOS):</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the Share button <Share className="inline h-3 w-3" /> at the bottom of the screen</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top-right corner</li>
            </ol>
          </div>
        );
      case 'samsung':
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Samsung Browser instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the menu button <MoreVertical className="inline h-3 w-3" /> in the bottom-right</li>
              <li>Select "Add page to" and then "Home screen"</li>
              <li>Confirm by tapping "Add"</li>
            </ol>
          </div>
        );
      case 'edge':
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Edge instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap the menu button <MoreVertical className="inline h-3 w-3" /> in the top-right</li>
              <li>Select "Add to phones" or "Install 4ochan.org"</li>
              <li>Tap "Install" on the prompt</li>
            </ol>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded mt-2 text-xs">
            <p className="font-bold">Install instructions:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Look for an "Install" or "Add to Home Screen" option in your browser's menu</li>
              <li>Follow the on-screen instructions to complete installation</li>
            </ol>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 transition-all duration-300 transform" 
         style={{ transform: isVisible ? 'translateY(0)' : 'translateY(200%)' }}
    >
      <div className="bg-white border-2 border-black rounded-md shadow-md overflow-hidden">
        <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center justify-between">
          <span className="flex items-center"><span className="mr-1">■</span> INSTALL 4OCHAN APP</span>
          <button onClick={dismissBanner} className="text-white hover:text-gray-200">
            <X className="h-3 w-3" />
          </button>
        </div>
        
        <div className="p-3">
          <div className="flex items-start">
            <div className="bg-gray-200 p-2 mr-3 rounded">
              <Download className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Install 4ochan.org as an app</h3>
              <ul className="text-xs mt-1 space-y-1">
                <li className="flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1 text-primary" />
                  <span>Works offline - read & post without internet</span>
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1 text-primary" />
                  <span>Faster loading times & smoother experience</span>
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-3 w-3 mr-1 text-primary" />
                  <span>No browser UI - full screen experience</span>
                </li>
              </ul>
            </div>
          </div>

          {renderBrowserSpecificInstructions()}
          
          <div className="mt-3 flex justify-between items-center">
            <button
              onClick={() => setExpandedInstructions(!expandedInstructions)}
              className="text-xs text-primary hover:underline flex items-center"
            >
              <Info className="h-3 w-3 mr-1" />
              {expandedInstructions ? 'Hide instructions' : 'How to install'}
            </button>
            
            {!isIos && isInstallable && (
              <button
                onClick={installPwa}
                className="bg-gray-200 text-black font-bold py-1 px-3 border-2 border-black text-xs"
                style={{ boxShadow: "2px 2px 0 #000" }}
              >
                INSTALL NOW
              </button>
            )}
            
            {isIos && (
              <div className="text-xs flex items-center">
                <Share className="h-3 w-3 mr-1" />
                <span>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallBanner;