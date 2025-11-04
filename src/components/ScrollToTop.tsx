import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollToTopProps {
  children?: React.ReactNode;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // More aggressive scroll-to-top behavior
    
    // 1. Scroll window to top immediately
    window.scrollTo(0, 0);
    
    // 2. Try to scroll main content areas to top immediately
    const mainContent = document.querySelector('.flex-1.overflow-auto') as HTMLElement;
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    
    // 3. Scroll any other scrollable containers to top
    const scrollableElements = document.querySelectorAll('[class*="overflow"], [class*="scroll"]');
    scrollableElements.forEach((el: any) => {
      if (el && typeof el.scrollTop === 'number') {
        el.scrollTop = 0;
      }
    });
    
    // 4. Multiple attempts to ensure scroll position is reset
    const attempts = [0, 10, 50, 100, 300];
    attempts.forEach((delay) => {
      setTimeout(() => {
        // Scroll window
        window.scrollTo(0, 0);
        
        // Scroll main content
        if (mainContent) {
          mainContent.scrollTop = 0;
        }
        
        // Scroll any other elements
        scrollableElements.forEach((el: any) => {
          if (el && typeof el.scrollTop === 'number') {
            el.scrollTop = 0;
          }
        });
      }, delay);
    });
    
  }, [location.pathname, location.key]); // Add location.key to catch back/forward navigation

  return <>{children}</>;
};

export default ScrollToTop;
