import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
}

// Global modal counter to track open modals
let modalCounter = 0;

// Function to get or create modal root
function getOrCreateModalRoot(): HTMLElement {
  let root = document.getElementById('modal-root') as HTMLElement;
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.left = '0';
    root.style.right = '0';
    root.style.bottom = '0';
    root.style.zIndex = '999999';
    root.style.pointerEvents = 'none'; // Important: allow clicks through empty root
    document.body.appendChild(root);
  }
  return root;
}

// Function to clean up modal root when no modals are open
function cleanupModalRoot() {
  const root = document.getElementById('modal-root');
  if (root) {
    if (root.children.length === 0) {
      // Remove immediately if no children
      document.body.removeChild(root);
    }
  }
}

// Simple, direct scroll management for DashboardLayout
function manageBodyScroll(isOpen: boolean) {
  // Find the actual scrollable container in DashboardLayout
  const scrollContainer = document.querySelector('.overflow-auto') as HTMLElement;
  
  console.log('🎯 Scroll management called:', { isOpen, hasScrollContainer: !!scrollContainer });
  
  if (isOpen) {
    // Store scroll position from the container
    if (scrollContainer) {
      const scrollTop = scrollContainer.scrollTop;
      scrollContainer.style.setProperty('--stored-scroll-top', `${scrollTop}px`);
      
      // Disable scrolling on the container
      scrollContainer.style.overflow = 'hidden';
      
      console.log('🔒 Container scroll locked at:', scrollTop);
    }
  } else {
    // Restore scroll position to the container
    if (scrollContainer) {
      const storedScrollTop = parseInt(scrollContainer.style.getPropertyValue('--stored-scroll-top') || '0');
      
      // Re-enable scrolling
      scrollContainer.style.overflow = 'auto';
      
      // Restore scroll position
      setTimeout(() => {
        scrollContainer.scrollTop = storedScrollTop;
        console.log('🔓 Container scroll restored to:', storedScrollTop);
      }, 10);
      
      // Clean up
      scrollContainer.style.removeProperty('--stored-scroll-top');
    }
  }
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  maxWidth = "max-w-4xl",
  maxHeight = "max-h-[90vh]"
}) => {
  const modalIdRef = useRef<string>('');
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Generate unique ID for this modal instance
      modalIdRef.current = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      modalCounter++;
      manageBodyScroll(true);
    } else {
      // Clean up when modal closes
      if (modalIdRef.current) {
        modalCounter = Math.max(0, modalCounter - 1);
        
        console.log('🚀 Starting modal cleanup');
        
        // Restore scroll immediately
        manageBodyScroll(false);
        
        // Multiple restoration attempts
        setTimeout(() => {
          if (isMountedRef.current) {
            manageBodyScroll(false);
            console.log('🔄 Cleanup attempt 1');
          }
        }, 50);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            manageBodyScroll(false);
            cleanupModalRoot();
            console.log('🔄 Final cleanup completed');
          }
        }, 200);
      }
    }

    // Cleanup on unmount
    return () => {
      if (modalIdRef.current && isMountedRef.current) {
        modalCounter = Math.max(0, modalCounter - 1);
        manageBodyScroll(false);
        cleanupModalRoot();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence 
      onExitComplete={() => {
        // Final cleanup after animation completes - ensure scroll is restored
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log('🎬 Animation exit complete - final scroll restoration');
            manageBodyScroll(false);
            cleanupModalRoot();
            
            // Force enable scrolling as a safety measure
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            
            console.log('🔄 Final cleanup on exit complete');
          }
        }, 50);
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 999999,
          pointerEvents: 'auto' // Enable pointer events for the backdrop
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} ${maxHeight} overflow-hidden border border-gray-200 ${className}`}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxHeight: '90vh', 
            overflowY: 'auto',
            pointerEvents: 'auto' // Enable pointer events for the modal content
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Get or create modal root and render content
  const modalRoot = getOrCreateModalRoot();
  return createPortal(modalContent, modalRoot);
};

export default ModalWrapper;