import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import './TransactionModal.css';

interface TransactionModalProps {
  title: string;
  description: string;
  onComplete: () => void;
  onClose?: () => void;
  duration?: number;
}

export function TransactionModal({ title, description, onComplete, duration = 2000 }: TransactionModalProps) {
  const [state, setState] = useState<'pending' | 'success'>('pending');

  useEffect(() => {
    const timer = setTimeout(() => {
      setState('success');
      setTimeout(onComplete, 1000);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal tx-modal"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {state === 'pending' && (
            <div className="tx-modal-content">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Loader2 size={48} className="spinner" />
              </motion.div>
              <h3>{title}</h3>
              <p className="text-secondary">{description}</p>
            </div>
          )}

          {state === 'success' && (
            <div className="tx-modal-content">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="success-circle"
              >
                <Check size={32} />
              </motion.div>
              <h3>Transaction confirmée !</h3>
              <p className="text-secondary">L'opération a été exécutée avec succès.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
