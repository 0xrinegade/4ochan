import React, { useState, useEffect } from 'react';
import { X, ArrowRight, RefreshCw, Wifi, WifiOff, Cpu, HardDrive } from 'lucide-react';

const PwaOnboardingTour: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isPwaMode, setIsPwaMode] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
                         
    setIsPwaMode(isStandalone);
    
    // Only show onboarding for PWA users who haven't seen it before
    const hasCompletedOnboarding = localStorage.getItem('pwa-onboarding-completed') === 'true';
    
    if (isStandalone && !hasCompletedOnboarding) {
      // Delay showing the tour slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-onboarding-completed', 'true');
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      completeOnboarding();
    }
  };

  // If it's not a PWA or onboarding was dismissed, don't render
  if (!isPwaMode || dismissed || !isVisible) {
    return null;
  }

  const steps = [
    {
      title: "Welcome to 4ochan App!",
      icon: <img src="/icon-192x192.svg" alt="4ochan Logo" className="h-8 w-8" />,
      content: "You're now using the installed app version of 4ochan.org with enhanced features!"
    },
    {
      title: "Offline Mode",
      icon: <WifiOff className="h-8 w-8 text-primary" />,
      content: "You can browse and post even without internet. Posts will be saved and published when you're back online."
    },
    {
      title: "Faster Experience",
      icon: <Cpu className="h-8 w-8 text-primary" />,
      content: "The app loads faster and uses less data than the website. Everything is optimized for speed!"
    },
    {
      title: "Local Storage",
      icon: <HardDrive className="h-8 w-8 text-primary" />,
      content: "Your posts, threads and settings are securely stored on your device."
    },
    {
      title: "Check for Updates",
      icon: <RefreshCw className="h-8 w-8 text-primary" />,
      content: "Periodically refresh the app to get the latest features and improvements."
    }
  ];

  const currentStep = steps[activeStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-black rounded-md shadow-md w-full max-w-md">
        <div className="bg-primary text-white py-0.5 px-2 font-bold text-xs flex items-center justify-between">
          <span className="flex items-center"><span className="mr-1">■</span> WELCOME TO THE APP</span>
          <button onClick={completeOnboarding} className="text-white hover:text-gray-200">
            <X className="h-3 w-3" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-4">
            <div className="bg-gray-200 p-2 mr-3 rounded-full">
              {currentStep.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentStep.title}</h3>
            </div>
          </div>
          
          <p className="text-sm mb-4">{currentStep.content}</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-2 rounded-full ${index === activeStep ? 'bg-primary' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={completeOnboarding}
              className="text-sm text-gray-500 hover:underline"
            >
              Skip
            </button>
            
            <button
              onClick={nextStep}
              className="bg-gray-200 text-black font-bold py-1 px-3 border-2 border-black text-xs flex items-center"
              style={{ boxShadow: "2px 2px 0 #000" }}
            >
              {activeStep < steps.length - 1 ? (
                <>Next <ArrowRight className="ml-1 h-3 w-3" /></>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaOnboardingTour;