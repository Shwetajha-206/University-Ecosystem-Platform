import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  const config = ICONS[type] || ICONS.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border} shadow-lg min-w-[300px] max-w-md animate-slide-in`}>
      <Icon size={20} className={`${config.color} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-gray-800 flex-1 leading-relaxed">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-gray-200/50 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X size={16} className="text-gray-500" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}
