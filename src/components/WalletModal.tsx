import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { X, Loader2, Check, ExternalLink } from 'lucide-react';
import './WalletModal.css';

interface WalletModalProps {
  onClose: () => void;
}

type ModalState = 'select' | 'connecting' | 'success' | 'error';

export function WalletModal({ onClose }: WalletModalProps) {
  const [state, setState] = useState<ModalState>('select');
  const { connectWallet, setShowOnboarding } = useApp();
  const navigate = useNavigate();

  const handleConnect = async () => {
    setState('connecting');
    try {
      await connectWallet();
      setState('success');
      setTimeout(() => {
        onClose();
        navigate('/app');
        setShowOnboarding(true);
      }, 800);
    } catch {
      setState('error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={state === 'select' ? onClose : undefined}
      >
        <motion.div
          className="modal wallet-modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {state === 'select' && (
            <>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
              <div className="wallet-modal-header">
                <h2>Connecter votre wallet</h2>
                <p className="text-secondary">Choisissez votre wallet Alephium pour continuer</p>
              </div>
              <div className="wallet-options">
                <button className="wallet-option" onClick={handleConnect}>
                  <div className="wallet-option-icon alph-ext">α</div>
                  <div className="wallet-option-info">
                    <span className="wallet-option-name">Alephium Extension Wallet</span>
                    <span className="wallet-option-desc">Extension navigateur</span>
                  </div>
                  <ExternalLink size={16} className="wallet-option-arrow" />
                </button>
                <button className="wallet-option" onClick={handleConnect}>
                  <div className="wallet-option-icon alph-desktop">α</div>
                  <div className="wallet-option-info">
                    <span className="wallet-option-name">Alephium Desktop Wallet</span>
                    <span className="wallet-option-desc">Application de bureau</span>
                  </div>
                  <ExternalLink size={16} className="wallet-option-arrow" />
                </button>
                <button className="wallet-option" onClick={handleConnect}>
                  <div className="wallet-option-icon wc">W</div>
                  <div className="wallet-option-info">
                    <span className="wallet-option-name">WalletConnect</span>
                    <span className="wallet-option-desc">Scanner un QR code</span>
                  </div>
                  <ExternalLink size={16} className="wallet-option-arrow" />
                </button>
              </div>
              <p className="wallet-modal-footer text-sm text-secondary">
                Pas de wallet ? <a href="https://alephium.org" target="_blank" rel="noreferrer">Créer un wallet Alephium →</a>
              </p>
            </>
          )}

          {state === 'connecting' && (
            <div className="wallet-state-view">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Loader2 size={48} className="spinner" />
              </motion.div>
              <h3>Approbation en cours...</h3>
              <p className="text-secondary">Confirmez la connexion dans votre wallet</p>
            </div>
          )}

          {state === 'success' && (
            <div className="wallet-state-view">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="success-circle"
              >
                <Check size={32} />
              </motion.div>
              <h3>Wallet connecté !</h3>
              <p className="text-secondary">Redirection vers le dashboard...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="wallet-state-view">
              <div className="error-circle">
                <X size={32} />
              </div>
              <h3>Connexion refusée</h3>
              <p className="text-secondary">La connexion a été refusée ou a échoué.</p>
              <button className="btn btn-primary" onClick={() => setState('select')}>
                Réessayer
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
