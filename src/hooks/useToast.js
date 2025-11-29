import { useState, useCallback } from 'react';

/**
 * 토스트 알림을 관리하는 훅
 * @returns {Object} { toast, showToast }
 */
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
};
