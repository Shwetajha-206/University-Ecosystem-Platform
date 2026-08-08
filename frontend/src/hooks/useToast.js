import { useState, useCallback } from 'react';

let globalToastHandler = null;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  // Register global handler
  if (!globalToastHandler) {
    globalToastHandler = { success, error, warning, info };
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}

// Global toast function for use outside React components
export const toast = {
  success: (message, duration) => globalToastHandler?.success(message, duration),
  error: (message, duration) => globalToastHandler?.error(message, duration),
  warning: (message, duration) => globalToastHandler?.warning(message, duration),
  info: (message, duration) => globalToastHandler?.info(message, duration),
};
