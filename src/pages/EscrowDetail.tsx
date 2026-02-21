import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Timeline } from '../components/Timeline';
import { StatusBadge } from '../components/StatusBadge';
import { WalletAddress } from '../components/WalletAddress';
import { TransactionModal } from '../components/TransactionModal';
import {
  ArrowLeft, Check, AlertTriangle, Package, Clock, X, DollarSign, ExternalLink, Send,
} from 'lucide-react';

import './EscrowDetail.css';

type ModalType = 'deliver' | 'release' | 'claim' | null;

export function EscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { escrows, timelineEvents, currentRole, updateEscrow, addTimelineEvent } = useApp();

  const escrow = escrows.find((e) => e.id === id);
  const events = timelineEvents[id || ''] || [];

  const [showModal, setShowModal] = useState<ModalType>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  // Delivery modal state
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryLink, setDeliveryLink] = useState('');

  const daysLeft = useMemo(() => {
    if (!escrow) return 0;
    const now = new Date();
    const dl = new Date(escrow.deadline);
    return Math.ceil((dl.getTime() - now.getTime()) / 86400000);
  }, [escrow]);

  const isExpired = daysLeft < 0;

  const handleAction = useCallback((action: string) => {
    setPendingAction(action);
    setShowTxModal(true);
  }, []);

  const handleTxComplete = useCallback(() => {
    const now = new Date().toISOString();

    if (pendingAction === 'deliver') {
      updateEscrow(id!, { status: 'delivered', deliveryMessage, deliveryLink, progress: 90 });
      addTimelineEvent(id!, { date: now, event: 'Livraison soumise', actor: 'freelance', icon: 'deliver' });
    } else if (pendingAction === 'release') {
      updateEscrow(id!, { status: 'completed', completedAt: now, progress: 100 });
      addTimelineEvent(id!, {
        date: now,
        event: `Fonds libérés — ${escrow!.amount} ALPH envoyés au freelance`,
        actor: 'client', icon: 'release', txHash: `0x${Math.random().toString(16).slice(2, 14)}...`,
      });
    } else if (pendingAction === 'claim') {
      updateEscrow(id!, { status: 'expired', progress: 100 });
      addTimelineEvent(id!, {
        date: now,
        event: `Auto-release — ${escrow!.amount} ALPH réclamés par le freelance`,
        actor: 'system', icon: 'release', txHash: `0x${Math.random().toString(16).slice(2, 14)}...`,
      });
    } else if (pendingAction === 'accept') {
      updateEscrow(id!, { status: 'active', progress: 20 });
      addTimelineEvent(id!, { date: now, event: 'Mission acceptée', actor: 'freelance', icon: 'accept' });
    } else if (pendingAction === 'cancel') {
      updateEscrow(id!, { status: 'refunded', progress: 0 });
      addTimelineEvent(id!, { date: now, event: 'Escrow annulé — fonds remboursés', actor: 'client', icon: 'create' });
    } else if (pendingAction === 'refuse') {
      updateEscrow(id!, { status: 'refunded', progress: 0 });
      addTimelineEvent(id!, { date: now, event: 'Mission refusée — fonds remboursés', actor: 'freelance', icon: 'create' });
    }

    setShowTxModal(false);
    setShowModal(null);
    setPendingAction('');
  }, [pendingAction, id, escrow, updateEscrow, addTimelineEvent, deliveryMessage, deliveryLink]);

  if (!escrow) {
    return (
      <div className="empty-state" style={{ padding: '80px 20px' }}>
        <h3>Escrow introuvable</h3>
        <p className="text-secondary">Cet escrow n'existe pas.</p>
        <button className="btn btn-primary" onClick={() => navigate('/app')}>
          Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="escrow-detail">
      {/* TX Modal */}
      {showTxModal && (
        <TransactionModal
          title="Transaction en cours..."
          description="Approbation dans votre wallet..."
          onComplete={handleTxComplete}
          onClose={() => setShowTxModal(false)}
        />
      )}

      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/app')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Retour au dashboard
      </button>

      {/* Auto-release banner */}
      {isExpired && escrow.status !== 'completed' && escrow.status !== 'refunded' && escrow.status !== 'expired' && currentRole === 'freelance' && (
        <motion.div
          className="auto-release-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Clock size={20} />
          <div>
            <strong>⏰ Le deadline est dépassé.</strong> Le client n'a pas validé ni contesté. Vous pouvez réclamer les fonds.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => handleAction('claim')}>
            Réclamer mes fonds
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-top">
          <StatusBadge status={escrow.status} />
          <span className="text-mono text-secondary">#{escrow.id}</span>
        </div>
        <h1>{escrow.title}</h1>
        <p className="text-secondary">
          Créé le {new Date(escrow.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — Deadline : {new Date(escrow.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {daysLeft > 0 && <span className={`deadline-countdown ${daysLeft <= 1 ? 'urgent' : ''}`}> (J-{daysLeft})</span>}
          {isExpired && <span className="deadline-countdown urgent"> (Expiré)</span>}
        </p>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="detail-left">
          {/* Timeline */}
          <div className="detail-section card" data-tour="detail-timeline">
            <h2>Timeline</h2>
            <Timeline events={events} />
          </div>

          {/* Activity log */}
          <div className="detail-section card">
            <h2>Historique des événements</h2>
            <div className="activity-log">
              {[...events].reverse().map((event, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-date text-sm text-secondary">
                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="activity-event">{event.event}</span>
                  {event.txHash && (
                    <a href="#" className="activity-tx text-mono" onClick={(e) => e.preventDefault()}>
                      Tx: {event.txHash}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="detail-right">
          {/* Contract info */}
          <div className="detail-section card" data-tour="detail-info">
            <h2>Informations du contrat</h2>
            <div className="info-grid">
              <div className="info-row">
                <span className="text-secondary">Montant verrouillé</span>
                <span className="text-mono" style={{ fontWeight: 600, fontSize: 16 }}>{escrow.amount.toLocaleString()} ALPH</span>
              </div>
              <div className="info-row">
                <span className="text-secondary">Client</span>
                <WalletAddress address={currentRole === 'client' ? '0x7a3f...2d5e (vous)' : escrow.counterparty} />
              </div>
              <div className="info-row">
                <span className="text-secondary">Freelance</span>
                <WalletAddress address={currentRole === 'freelance' ? '0x7a3f...2d5e (vous)' : escrow.counterparty} />
              </div>
              {escrow.arbiter && (
                <div className="info-row">
                  <span className="text-secondary">Arbitre</span>
                  <WalletAddress address={escrow.arbiter} />
                </div>
              )}
              <div className="info-row">
                <span className="text-secondary">Deadline</span>
                <span>{new Date(escrow.deadline).toLocaleDateString('fr-FR')} {daysLeft > 0 ? `(J-${daysLeft})` : '(Expiré)'}</span>
              </div>
              <div className="info-row">
                <span className="text-secondary">Frais</span>
                <span className="text-mono">{(escrow.amount * 0.005).toFixed(2)} ALPH (0.5%)</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          {escrow.status === 'delivered' && escrow.deliveryMessage && (
            <div className="detail-section card">
              <h2>Livraison soumise</h2>
              <p style={{ fontSize: 14, marginBottom: 8 }}>{escrow.deliveryMessage}</p>
              {escrow.deliveryLink && (
                <a href={escrow.deliveryLink} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ fontSize: 13 }}>
                  <ExternalLink size={14} /> {escrow.deliveryLink}
                </a>
              )}
            </div>
          )}

          {/* Dispute info */}
          {escrow.status === 'disputed' && escrow.dispute && (
            <div className="detail-section card">
              <h2>Litige en cours</h2>
              <div className="dispute-arguments">
                <div className="dispute-arg">
                  <div className="dispute-arg-header">Argument du Client</div>
                  <p>{escrow.dispute.clientArgument}</p>
                </div>
                <div className="dispute-arg">
                  <div className="dispute-arg-header">Argument du Freelance</div>
                  {escrow.dispute.freelanceArgument ? (
                    <p>{escrow.dispute.freelanceArgument}</p>
                  ) : (
                    <p className="text-secondary" style={{ fontStyle: 'italic' }}>En attente de réponse</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="detail-section card" data-tour="detail-actions">
            <h2>Actions</h2>
            <div className="action-buttons">
              {/* CLIENT actions */}
              {currentRole === 'client' && escrow.status === 'pending' && (
                <button className="btn btn-danger" onClick={() => handleAction('cancel')}>
                  <X size={16} /> Annuler l'escrow
                </button>
              )}
              {currentRole === 'client' && escrow.status === 'active' && (
                <>
                  <button className="btn btn-success" onClick={() => handleAction('release')}>
                    <Check size={16} /> Libérer les fonds
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/app/escrow/${escrow.id}/dispute`)}>
                    <AlertTriangle size={16} /> Ouvrir un litige
                  </button>
                </>
              )}
              {currentRole === 'client' && escrow.status === 'delivered' && (
                <>
                  <button className="btn btn-success" onClick={() => handleAction('release')}>
                    <Check size={16} /> Accepter & Libérer
                  </button>
                  <button className="btn btn-danger" onClick={() => navigate(`/app/escrow/${escrow.id}/dispute`)}>
                    <AlertTriangle size={16} /> Rejeter & Contester
                  </button>
                </>
              )}

              {/* FREELANCE actions */}
              {currentRole === 'freelance' && escrow.status === 'pending' && (
                <>
                  <button className="btn btn-success" onClick={() => handleAction('accept')}>
                    <Check size={16} /> Accepter la mission
                  </button>
                  <button className="btn btn-danger" onClick={() => handleAction('refuse')}>
                    <X size={16} /> Refuser
                  </button>
                </>
              )}
              {currentRole === 'freelance' && escrow.status === 'active' && (
                <>
                  <button className="btn btn-primary" onClick={() => setShowModal('deliver')}>
                    <Package size={16} /> Soumettre la livraison
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/app/escrow/${escrow.id}/dispute`)}>
                    <AlertTriangle size={16} /> Ouvrir un litige
                  </button>
                </>
              )}
              {currentRole === 'freelance' && isExpired && !['completed', 'refunded', 'expired'].includes(escrow.status) && (
                <button className="btn btn-success" onClick={() => handleAction('claim')}>
                  <DollarSign size={16} /> Réclamer les fonds (auto-release)
                </button>
              )}

              {/* ARBITER actions */}
              {currentRole === 'arbiter' && escrow.status === 'disputed' && (
                <>
                  <button className="btn btn-success" onClick={() => handleAction('release')}>
                    Fonds au freelance (mission livrée)
                  </button>
                  <button className="btn btn-danger" onClick={() => handleAction('cancel')}>
                    Fonds au client (remboursement)
                  </button>
                </>
              )}

              {/* No actions */}
              {(
                (escrow.status === 'completed' || escrow.status === 'refunded' || escrow.status === 'expired') ||
                (currentRole === 'client' && escrow.status === 'disputed') ||
                (currentRole === 'freelance' && ['delivered', 'disputed'].includes(escrow.status) && !isExpired)
              ) && (
                <p className="text-secondary text-sm" style={{ fontStyle: 'italic' }}>
                  {escrow.status === 'completed' ? 'Escrow terminé — aucune action disponible.' :
                   escrow.status === 'refunded' ? 'Escrow remboursé — aucune action disponible.' :
                   escrow.status === 'expired' ? 'Escrow expiré — fonds réclamés.' :
                   escrow.status === 'disputed' ? 'En attente de la décision de l\'arbitre.' :
                   'En attente de réponse de la contrepartie.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deliver modal */}
      <AnimatePresence>
        {showModal === 'deliver' && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(null)}><X size={20} /></button>
              <h2 style={{ marginBottom: 16 }}>Soumettre la livraison</h2>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label>Message au client (optionnel)</label>
                <textarea className="input" placeholder="Décrivez ce que vous avez livré, ajoutez des liens..." value={deliveryMessage} onChange={(e) => setDeliveryMessage(e.target.value)} />
              </div>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label>Lien vers le livrable (optionnel)</label>
                <input className="input" placeholder="https://..." value={deliveryLink} onChange={(e) => setDeliveryLink(e.target.value)} />
              </div>

              <p className="text-sm text-secondary" style={{ marginBottom: 20 }}>
                Le client sera notifié et pourra libérer les fonds ou contester.
              </p>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setShowModal(null); handleAction('deliver'); }}>
                <Send size={16} /> Confirmer la livraison
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
