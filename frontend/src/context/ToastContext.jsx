import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);

let emitToast = null;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  error: 'border-red-500/50 bg-red-500/10 text-red-900 dark:text-red-100',
  info: 'border-sky-500/50 bg-sky-500/10 text-sky-900 dark:text-sky-100',
};

function push(type, message, duration = 4500) {
  if (!message) return;
  emitToast?.({ id: `${Date.now()}-${Math.random()}`, type, message: String(message), duration });
}

export const toast = {
  success: (message, duration) => push('success', message, duration),
  error: (message, duration) => push('error', message, duration ?? 6000),
  info: (message, duration) => push('info', message, duration ?? 6000),
};

export function useToast() {
  return useContext(ToastContext) || toast;
}

function ToastItem({ item, onDismiss }) {
  const Icon = ICONS[item.type] || Info;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className={cn(
        'pointer-events-auto w-[min(100vw-2rem,380px)] rounded-xl border shadow-lg backdrop-blur-md px-4 py-3 flex gap-3',
        STYLES[item.type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium leading-snug flex-1 whitespace-pre-line">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const add = useCallback((item) => {
    setItems((prev) => [...prev.slice(-5), item]);
    window.setTimeout(() => dismiss(item.id), item.duration);
  }, [dismiss]);

  emitToast = add;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ToastItem key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
