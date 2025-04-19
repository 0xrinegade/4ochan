import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const { transitionState, currentPath } = useNavigation();
  const [content, setContent] = useState<React.ReactNode>(children);
  
  // Update content when path changes and transition is complete
  useEffect(() => {
    if (transitionState === 'exited') {
      setContent(children);
    }
  }, [transitionState, children]);
  
  // Determine classes based on transition state
  let transitionClasses = '';
  
  switch (transitionState) {
    case 'entering':
      transitionClasses = 'opacity-0 transform translate-y-4 scale-95';
      break;
    case 'entered':
      transitionClasses = 'opacity-100 transform translate-y-0 scale-100';
      break;
    case 'exiting':
      transitionClasses = 'opacity-0 transform -translate-y-4 scale-95';
      break;
    case 'exited':
      transitionClasses = 'opacity-0';
      break;
  }
  
  return (
    <div
      key={currentPath}
      className={`transition-all duration-300 ease-in-out ${transitionClasses} ${className}`}
    >
      {content}
    </div>
  );
};

export default PageTransition;