'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastData {
  id: number;
  emoji?: string;
  title: string;
  body?: string;
}

interface ToastCtx {
  show: (t: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

let counter = 0;

/** A tiny themed toast stack, top-right, auto-dismiss. Custom (no library) to
 *  match the glass aesthetic. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((t: Omit<ToastData, 'id'>) => {
    counter += 1;
    const id = counter;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="glass-card pointer-events-auto flex max-w-xs items-center gap-3 p-3 pr-4"
              role="status"
            >
              {t.emoji && <span className="text-2xl">{t.emoji}</span>}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{t.title}</p>
                {t.body && <p className="truncate text-xs text-text-secondary">{t.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
