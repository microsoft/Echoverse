import React from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import type { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Record<
  ToastMessage['type'],
  { bg: string; border: string; icon: React.ReactNode; textColor: string }
> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: <FiCheckCircle className="w-5 h-5 text-green-500" />,
    textColor: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: <FiAlertCircle className="w-5 h-5 text-red-500" />,
    textColor: 'text-red-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon: <FiInfo className="w-5 h-5 text-blue-500" />,
    textColor: 'text-blue-800',
  },
};

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in-right ${config.bg} ${config.border}`}
            role="alert"
          >
            <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
            <p className={`text-sm font-medium flex-1 ${config.textColor}`}>
              {toast.message}
            </p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition"
              aria-label="Dismiss"
            >
              <FiX className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        );
      })}

      {/* Inline keyframe for slide-in animation */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
