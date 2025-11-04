import { useCallback } from 'react';
import { useModalWithAutoId } from '../providers/ModalProvider';
import ConfirmModal from '../components/ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const useConfirm = () => {
  const { openModal } = useModalWithAutoId();

  const confirm = useCallback(
    (options: ConfirmOptions & { onConfirm: () => void }) => {
      const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        variant = 'info',
        onConfirm
      } = options;

      return new Promise<boolean>((resolve) => {
        openModal(ConfirmModal, {
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onConfirm: () => {
            onConfirm();
            resolve(true);
          },
          onClose: () => resolve(false)
        });
      });
    },
    [openModal]
  );

  const confirmDanger = useCallback(
    (options: ConfirmOptions & { onConfirm: () => void }) => {
      return confirm({ ...options, variant: 'danger' });
    },
    [confirm]
  );

  const confirmWarning = useCallback(
    (options: ConfirmOptions & { onConfirm: () => void }) => {
      return confirm({ ...options, variant: 'warning' });
    },
    [confirm]
  );

  return {
    confirm,
    confirmDanger,
    confirmWarning
  };
};
