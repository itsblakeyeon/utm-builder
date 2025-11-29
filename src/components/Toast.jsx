import { useEffect } from 'react';

/**
 * 토스트 알림 컴포넌트
 * alert 대신 비침투적인 알림을 표시
 */
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // 2초 후 자동 사라짐

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  }[type] || 'bg-gray-600';

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default Toast;
