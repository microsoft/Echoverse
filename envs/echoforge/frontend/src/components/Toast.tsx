import { useEffect } from 'react';
import { Icon } from '../echoforge-ui';
import { classNames } from '../utils';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), 3600));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDismiss, toasts]);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={classNames('toast', `toast-${toast.type}`)}>
          <div className="toast-row">
            <div>{toast.message}</div>
            <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
              <Icon name="x" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
