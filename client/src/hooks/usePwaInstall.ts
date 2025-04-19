import { useState, useEffect } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'samsung' | 'other';

export interface UsePwaInstallResult {
  isInstallable: boolean;
  isPwaInstalled: boolean;
  installPwa: () => Promise<void>;
  deferredPrompt: BeforeInstallPromptEvent | null;
  browserType: BrowserType;
  isIos: boolean;
  isStandalone: boolean;
}

export function usePwaInstall(): UsePwaInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [browserType, setBrowserType] = useState<BrowserType>('other');
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed as PWA)
    const isRunningStandalone = () => {
      return (window.matchMedia('(display-mode: standalone)').matches) || 
             (window.navigator as any).standalone === true;
    };

    // Detect browser type
    const detectBrowser = (): BrowserType => {
      const ua = navigator.userAgent.toLowerCase();
      
      if (ua.indexOf('edge') > -1 || ua.indexOf('edg/') > -1) {
        return 'edge';
      } else if (ua.indexOf('firefox') > -1) {
        return 'firefox';
      } else if (ua.indexOf('opr') > -1 || ua.indexOf('opera') > -1) {
        return 'opera';
      } else if (ua.indexOf('samsungbrowser') > -1) {
        return 'samsung';
      } else if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1) {
        return 'safari';
      } else if (ua.indexOf('chrome') > -1) {
        return 'chrome';
      }
      return 'other';
    };

    // Detect iOS device
    const isIosDevice = (): boolean => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // Set initial state
    setIsStandalone(isRunningStandalone());
    setBrowserType(detectBrowser());
    setIsIos(isIosDevice());
    
    // Update PWA installation state
    setIsPwaInstalled(isRunningStandalone());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      event.preventDefault();
      
      // Store the event so it can be triggered later
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      
      // Update UI to indicate app can be installed
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      // App is installed, update state
      setIsPwaInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Log the installation
      console.log('PWA was installed');
      
      // You could trigger analytics event here
      // analytics.track('pwa-installed');
      
      // Store in local storage that app was installed
      localStorage.setItem('pwa-installed', 'true');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsPwaInstalled(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Function to trigger installation
  const installPwa = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.log('Installation prompt not available');
      return;
    }

    try {
      // Show the installation prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
        setIsPwaInstalled(true);
      } else {
        console.log('User dismissed the PWA installation');
      }
      
      // Clear the saved prompt as it can't be used again
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  return {
    isInstallable,
    isPwaInstalled,
    installPwa,
    deferredPrompt,
    browserType,
    isIos,
    isStandalone
  };
}