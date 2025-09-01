import { createContext, useContext, useState, useCallback } from 'react';
import type { ToastData } from '../components/ui/Toast';

interface ToastContextType {
  toasts: ToastData[];
  addToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number, position?: 'top-right' | 'center') => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const useToastState = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000, position: 'top-right' | 'center' = 'center') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = { id, message, type, duration, position };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};