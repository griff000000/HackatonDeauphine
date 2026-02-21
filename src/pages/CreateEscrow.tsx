import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TransactionModal } from '../components/TransactionModal';
import { ArrowLeft, ArrowRight, Check, Info, AlertTriangle, Share2, ExternalLink } from 'lucide-react';
import type { Escrow, TimelineEvent } from '../data/mock';
import './CreateEscrow.css';

type Step = 1 | 2 | 3;
type ViewState = 'form' | 'confirming' | 'success';

export function CreateEscrow() {
  const { wallet, addEscrow, addTimelineEvent } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [viewState, setViewState] = useState<ViewState>('form');

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [freelanceAddr, setFreelanceAddr] = useState('');
  const [arbiterAddr, setArbiterAddr] = useState('');

  // Step 2 fields
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Step 3
  const [agreed, setAgreed] = useState(false);

  // Success state
  const [createdId, setCreatedId] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const fee = parseFloat(amount || '0') * 0.005;
  const total = parseFloat(amount || '0') + fee;
  const balance = wallet?.balance || 0;
  const insufficientFunds = total > balance;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const canProceedStep1 = title.trim() && freelanceAddr.trim();
  const canProceedStep2 = parseFloat(amount) > 0 && deadline && !insufficientFunds;

  const handleConfirm = useCallback(() => {
    setViewState('confirming');
  }, []);

  const handleComplete = useCallback(() => {
    const newId = `ESC-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const now = new Date().toISOString();

    const newEscrow: Escrow = {
      id: newId,
      title,
      amount: parseFloat(amount),
      token: 'ALPH',
      status: 'pending',
      role: 'client',
      counterparty: freelanceAddr.length > 10 ? `${freelanceAddr.slice(0, 6)}...${freelanceAddr.slice(-4)}` : freelanceAddr,
      arbiter: arbiterAddr || null,
      createdAt: now,
      deadline: new Date(deadline + 'T23:59:00Z').toISOString(),
      progress: 0,
      description: description || title,
    };

    const events: TimelineEvent[] = [
      { date: now, event: 'Escrow créé', actor: 'client', icon: 'create' },
      { date: now, event: `${parseFloat(amount)} ALPH déposés`, actor: 'client', icon: 'deposit', txHash: `0x${Math.random().toString(16).slice(2, 14)}...` },
    ];

    addEscrow(newEscrow);
    events.forEach((e) => addTimelineEvent(newId, e));

    setCreatedId(newId);
    setViewState('success');
  }, [title, amount, description, freelanceAddr, arbiterAddr, deadline, addEscrow, addTimelineEvent]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://alphtrust.app/escrow/${createdId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Transaction modal
  if (viewState === 'confirming') {
    return (
      <TransactionModal
        title="Transaction en cours..."
        description="Approbation dans votre wallet..."
        onComplete={handleComplete}
        onClose={() => setViewState('form')}
      />
    );
  }

  // Success screen
  if (viewState === 'success') {
    return (
      <motion.div
        className="create-success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="success-circle large"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        >
          <Check size={40} />
        </motion.div>
        <h2>Escrow créé avec succès !</h2>
        <p className="text-secondary">Les fonds sont maintenant sécurisés dans le smart contract.</p>

        <div className="success-info card">
          <div className="success-info-row">
            <span className="text-secondary">ID de l'escrow</span>
            <span className="text-mono" style={{ fontWeight: 500 }}>#{createdId}</span>
          </div>
          <div className="success-info-row">
            <span className="text-secondary">Hash transaction</span>
            <a href="#" className="text-mono" style={{ fontSize: 13 }} onClick={(e) => e.preventDefault()}>
              0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 6)} <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/app/escrow/${createdId}`)}>
            Voir l'escrow <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary" onClick={handleCopyLink}>
            {linkCopied ? <><Check size={16} /> Lien copié !</> : <><Share2 size={16} /> Partager le lien</>}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/app')}>
            Retour au dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="create-escrow">
      <div className="create-header">
        <h1>Créer un Escrow</h1>
        <p className="text-secondary">Configurez votre escrow en quelques étapes simples.</p>
      </div>

      {/* Progress */}
      <div className="step-progress" data-tour="step-progress">
        {[
          { num: 1, label: 'Détails' },
          { num: 2, label: 'Conditions' },
          { num: 3, label: 'Confirmation' },
        ].map((s, i) => (
          <div key={s.num} className={`step-progress-item ${step >= s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
            <div className="step-progress-dot">
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className="step-progress-label">{s.label}</span>
            {i < 2 && <div className={`step-progress-line ${step > s.num ? 'filled' : ''}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="step-content card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Détails de la mission</h2>

            <div className="form-grid">
              <div className="input-group" data-tour="input-title">
                <label>Titre de la mission *</label>
                <input
                  className="input"
                  placeholder="Ex : Refonte UI Dashboard DeFi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="input-group" data-tour="input-description" style={{ gridColumn: '1 / -1' }}>
                <label>Description (optionnel)</label>
                <textarea
                  className="input"
                  placeholder="Décrivez brièvement le travail attendu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="input-group" data-tour="input-freelance">
                <label>Adresse du freelance *</label>
                <input
                  className="input"
                  placeholder="0x..."
                  value={freelanceAddr}
                  onChange={(e) => setFreelanceAddr(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="input-group" data-tour="input-arbiter">
                <label className="flex items-center gap-2">
                  Adresse de l'arbitre (optionnel)
                  <span className="tooltip">
                    <Info size={14} style={{ color: 'var(--gray-400)' }} />
                  </span>
                </label>
                <input
                  className="input"
                  placeholder="0x..."
                  value={arbiterAddr}
                  onChange={(e) => setArbiterAddr(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span className="text-sm text-secondary">
                  L'arbitre est un tiers de confiance qui ne peut intervenir QUE si un litige est ouvert.
                </span>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/app')}>
                <ArrowLeft size={16} /> Annuler
              </button>
              <button className="btn btn-primary" data-tour="step1-next" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Suivant <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="step-content card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Conditions financières</h2>

            <div className="form-grid">
              <div className="input-group" data-tour="input-amount">
                <label>Montant à déposer *</label>
                <div className="amount-input-wrapper">
                  <input
                    className="input amount-input"
                    type="number"
                    placeholder="500"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <span className="amount-token">ALPH</span>
                </div>
              </div>

              <div className="input-group" data-tour="input-deadline">
                <label>Deadline *</label>
                <input
                  className="input"
                  type="date"
                  min={minDate}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Frais de service</label>
                <div className="input readonly-input">
                  0.5% — {fee.toFixed(2)} ALPH
                </div>
              </div>
            </div>

            {/* Summary */}
            {parseFloat(amount) > 0 && (
              <div className="fee-summary">
                <div className="fee-row"><span>Montant verrouillé</span><span className="text-mono">{parseFloat(amount).toLocaleString()} ALPH</span></div>
                <div className="fee-row"><span>Frais AlphTrust (0.5%)</span><span className="text-mono">{fee.toFixed(2)} ALPH</span></div>
                <div className="divider" />
                <div className="fee-row total"><span>Total débité</span><span className="text-mono">{total.toFixed(2)} ALPH</span></div>
                <div className="fee-row"><span>Le freelance recevra</span><span className="text-mono" style={{ color: 'var(--success)' }}>{parseFloat(amount).toLocaleString()} ALPH</span></div>
              </div>
            )}

            <div className="wallet-balance-note">
              Votre solde : <span className="text-mono" style={{ fontWeight: 500 }}>{balance.toLocaleString()} ALPH</span>
              {insufficientFunds && (
                <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                  <AlertTriangle size={14} style={{ verticalAlign: 'middle' }} /> Solde insuffisant
                </span>
              )}
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Retour
              </button>
              <button className="btn btn-primary" data-tour="step2-next" disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Suivant <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <motion.div
            key="step3"
            className="step-content card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Récapitulatif de l'escrow</h2>

            <div className="recap-grid" data-tour="recap-grid">
              <div className="recap-row"><span className="text-secondary">Mission</span><span>{title}</span></div>
              {description && <div className="recap-row"><span className="text-secondary">Description</span><span>{description}</span></div>}
              <div className="recap-row"><span className="text-secondary">Freelance</span><span className="text-mono">{freelanceAddr}</span></div>
              {arbiterAddr && <div className="recap-row"><span className="text-secondary">Arbitre</span><span className="text-mono">{arbiterAddr}</span></div>}
              <div className="recap-row"><span className="text-secondary">Montant</span><span className="text-mono" style={{ fontWeight: 500 }}>{parseFloat(amount).toLocaleString()} ALPH</span></div>
              <div className="recap-row"><span className="text-secondary">Deadline</span><span>{new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="recap-row"><span className="text-secondary">Frais</span><span className="text-mono">{fee.toFixed(2)} ALPH (0.5%)</span></div>
            </div>

            <div className="warning-box" style={{ marginTop: 20 }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>En confirmant, <strong>{total.toFixed(2)} ALPH</strong> seront prélevés de votre wallet et verrouillés dans le smart contract.</span>
            </div>

            <label className="checkbox-label" data-tour="confirm-checkbox" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              Je comprends que les fonds seront verrouillés jusqu'à la livraison ou l'expiration du deadline.
            </label>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Modifier
              </button>
              <button className="btn btn-primary" data-tour="confirm-btn" disabled={!agreed} onClick={handleConfirm}>
                <Check size={16} /> Confirmer & Déposer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
