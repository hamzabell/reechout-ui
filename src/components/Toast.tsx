import React, { useEffect } from 'react';
import { ToastState } from '../types';

interface ToastProps {
  toast: ToastState;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.visible, onClose]);

  if (!toast.visible) {
    return null;
  }

  const iconClasses = {
    success: 'fas fa-check-circle text-success',
    error: 'fas fa-exclamation-circle text-error',
    warning: 'fas fa-exclamation-triangle text-warning',
    info: 'fas fa-info-circle text-primary'
  };

  const bgClasses = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-error/10 border-error/20',
    warning: 'bg-warning/10 border-warning/20',
    info: 'bg-primary/10 border-primary/20'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className={`
        glass border rounded-lg px-4 py-3 min-w-[300px] max-w-md
        ${bgClasses[toast.type]}
      `}>
        <div className="flex items-center">
          <i className={`${iconClasses[toast.type]} mr-3 text-lg`} />
          <span className="text-text-primary font-medium">{toast.message}</span>
          <button
            onClick={onClose}
            className="ml-auto text-text-muted hover:text-text-primary transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
