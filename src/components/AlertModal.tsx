import React from 'react';
import ModalWrapper from './ModalWrapper';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  autoClose = true
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: 'fas fa-check-circle text-green-500',
          bg: 'bg-green-50 border-green-200',
          buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        };
      case 'error':
        return {
          icon: 'fas fa-times-circle text-red-500',
          bg: 'bg-red-50 border-red-200',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: 'fas fa-exclamation-circle text-yellow-500',
          bg: 'bg-yellow-50 border-yellow-200',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      default:
        return {
          icon: 'fas fa-info-circle text-blue-500',
          bg: 'bg-blue-50 border-blue-200',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  const styles = getVariantStyles();

  // Auto-close after 3 seconds if autoClose is enabled
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className={`p-6 ${styles.bg} border-2 rounded-xl`}>
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-white rounded-full mb-4">
          <i className={`${styles.icon} text-xl`} />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.buttonBg}`}
          >
            OK
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default AlertModal;
