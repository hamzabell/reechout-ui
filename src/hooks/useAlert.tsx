import { useCallback } from 'react';
import { useModalWithAutoId } from '../providers/ModalProvider';
import AlertModal from '../components/AlertModal';

interface AlertOptions {
  title?: string;
  message?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
}

export const useAlert = () => {
  const { openModal } = useModalWithAutoId();

  const showAlert = useCallback(
    (options: AlertOptions) => {
      const {
        title = 'Notification',
        message = 'Operation completed',
        variant = 'info',
        autoClose = true
      } = options;

      return new Promise<void>((resolve) => {
        openModal(AlertModal, {
          title,
          message,
          variant,
          autoClose,
          onClose: () => resolve()
        });
      });
    },
    [openModal]
  );

  const showSuccess = useCallback(
    (message: string, title = 'Success') => {
      return showAlert({ title, message, variant: 'success' });
    },
    [showAlert]
  );

  const showError = useCallback(
    (message: string, title = 'Error') => {
      return showAlert({ title, message, variant: 'error', autoClose: false });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title = 'Warning') => {
      return showAlert({ title, message, variant: 'warning' });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string, title = 'Information') => {
      return showAlert({ title, message, variant: 'info' });
    },
    [showAlert]
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
