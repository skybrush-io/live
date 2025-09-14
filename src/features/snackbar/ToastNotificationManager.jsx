// src/features/snackbar/toast.jsx
import { toast } from 'react-hot-toast';
import { MessageSemantics } from './types';

// توابع داخلی بدون dispatch
function notify(n) {
  const content = (
    <div>
      {n.header && <strong>{n.header}</strong>}
      <div>{n.message}</div>
      {Array.isArray(n.buttons) && n.buttons.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {n.buttons.map((b, idx) => (
            <button key={idx} onClick={() => b.action?.()}>
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const options = {
    duration: n.permanent ? Infinity : n.timeout || 5000,
    style: { borderRadius: '8px', background: '#333', color: '#fff' },
    position: 'top-right',
  };

  const toastFn = {
    [MessageSemantics.INFO]: toast,
    [MessageSemantics.SUCCESS]: toast.success,
    [MessageSemantics.WARNING]: toast,
    [MessageSemantics.ERROR]: toast.error,
  }[n.semantics || MessageSemantics.INFO] || toast;

  toastFn(content, options);
}

// نسخه Thunk برای dispatch
export const showNotification = (notification) => {
  return () => {
    const n = typeof notification === 'string' ? { message: notification } : notification;
    notify(n);
  };
};

export const showError = (message) => {
  return () => {
    notify({ message, semantics: MessageSemantics.ERROR });
  };
};

export const showSuccess = (message) => {
  return () => {
    notify({ message, semantics: MessageSemantics.SUCCESS });
  };
};
