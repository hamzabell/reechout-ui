import React, { createContext, useContext, useReducer } from 'react';

export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
}

interface ModalState {
  modals: Modal[];
}

type ModalAction =
  | { type: 'OPEN_MODAL'; payload: Modal }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'CLOSE_ALL_MODALS' };

const ModalContext = createContext<{
  modals: Modal[];
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
} | null>(null);

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: [...state.modals, action.payload]
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: state.modals.filter(modal => modal.id !== action.payload)
      };
    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: []
      };
    default:
      return state;
  }
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(modalReducer, { modals: [] });

  const openModal = (modal: Modal) => {
    dispatch({ type: 'OPEN_MODAL', payload: modal });
  };

  const closeModal = (id: string) => {
    dispatch({ type: 'CLOSE_MODAL', payload: id });
  };

  const closeAllModals = () => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  };

  return (
    <ModalContext.Provider value={{ modals: state.modals, openModal, closeModal, closeAllModals }}>
      {children}
      {/* Render all active modals */}
      {state.modals.map((modal) => {
        const ModalComponent = modal.component;
        return (
          <ModalComponent
            key={modal.id}
            {...modal.props}
            isOpen={true}
            onClose={() => closeModal(modal.id)}
          />
        );
      })}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Hook for opening modals with auto-generated IDs
export function useModalWithAutoId() {
  const { openModal, closeModal } = useModal();

  const openModalAuto = (component: React.ComponentType<any>, props?: any) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    openModal({ id, component, props });
    return id;
  };

  return { openModal: openModalAuto, closeModal };
}