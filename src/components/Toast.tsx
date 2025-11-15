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
    success: 'fas fa-check-circle text-green-600',
    error: 'fas fa-exclamation-circle text-red-600',
    warning: 'fas fa-exclamation-triangle text-yellow-600',
    info: 'fas fa-info-circle text-blue-600'
  };

  const bgClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div className={`
        border rounded-lg px-4 py-3 min-w-[300px] max-w-md shadow-lg
        ${bgClasses[toast.type]}
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-center">
          <i className={`${iconClasses[toast.type]} mr-3 text-lg`} />
          <span className="text-gray-900 font-medium">{toast.message}</span>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
