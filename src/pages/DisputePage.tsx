import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { TransactionModal } from '../components/TransactionModal';
import { ArrowLeft, AlertTriangle, Check, Scale, Send } from 'lucide-react';
import './DisputePage.css';

type DisputeView = 'form' | 'confirming' | 'submitted' | 'arbiter';

const REASONS = [
  'Travail non livré',
  'Travail non conforme au brief',
  'Communication rompue',
  'Autre (préciser)',
];

export function DisputePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { escrows, currentRole, updateEscrow, addTimelineEvent } = useApp();

  const escrow = escrows.find((e) => e.id === id);

  const [view, setView] = useState<DisputeView>(
    escrow?.status === 'disputed'
      ? currentRole === 'arbiter' ? 'arbiter' : 'submitted'
      : 'form'
  );

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState('');
  const [freelanceResponse, setFreelanceResponse] = useState('');
  const [showTxModal, setShowTxModal] = useState(false);
  const [arbiterDecision, setArbiterDecision] = useState<'freelance' | 'client' | null>(null);

  const handleSubmitDispute = useCallback(() => {
    setShowTxModal(true);
  }, []);

  const handleDisputeConfirmed = useCallback(() => {
    const now = new Date().toISOString();
    updateEscrow(id!, {
      status: 'disputed',
      dispute: {
        openedBy: currentRole as 'client' | 'freelance',
        reason,
        clientArgument: currentRole === 'client' ? details : '',
        freelanceArgument: currentRole === 'freelance' ? details : null,
        evidence: evidence || undefined,
      },
    });
    addTimelineEvent(id!, {
      date: now,
      event: `Litige ouvert par le ${currentRole === 'client' ? 'client' : 'freelance'}`,
      actor: currentRole as 'client' | 'freelance',
      icon: 'dispute',
    });
    setShowTxModal(false);
    setView('submitted');
  }, [id, currentRole, reason, details, evidence, updateEscrow, addTimelineEvent]);

  const handleFreelanceRespond = useCallback(() => {
    if (!escrow?.dispute) return;
    updateEscrow(id!, {
      dispute: {
        ...escrow.dispute,
        freelanceArgument: freelanceResponse,
      },
    });
  }, [id, escrow, freelanceResponse, updateEscrow]);

  const handleArbiterDecision = useCallback((decision: 'freelance' | 'client') => {
    setArbiterDecision(decision);
    setShowTxModal(true);
  }, []);

  const handleArbiterConfirmed = useCallback(() => {
    const now = new Date().toISOString();
    if (arbiterDecision === 'freelance') {
      updateEscrow(id!, { status: 'completed', completedAt: now, progress: 100 });
      addTimelineEvent(id!, {
        date: now,
        event: `Arbitre a tranché — Fonds envoyés au freelance (${escrow!.amount} ALPH)`,
        actor: 'arbiter',
        icon: 'resolve',
        txHash: `0x${Math.random().toString(16).slice(2, 14)}...`,
      });
    } else {
      updateEscrow(id!, { status: 'refunded', progress: 0 });
      addTimelineEvent(id!, {
        date: now,
        event: `Arbitre a tranché — Fonds remboursés au client (${escrow!.amount} ALPH)`,
        actor: 'arbiter',
        icon: 'resolve',
        txHash: `0x${Math.random().toString(16).slice(2, 14)}...`,
      });
    }
    setShowTxModal(false);
    navigate(`/app/escrow/${id}`);
  }, [id, escrow, arbiterDecision, updateEscrow, addTimelineEvent, navigate]);

  if (!escrow) {
    return (
      <div className="empty-state" style={{ padding: '80px 20px' }}>
        <h3>Escrow introuvable</h3>
        <button className="btn btn-primary" onClick={() => navigate('/app')}>Retour au dashboard</button>
      </div>
    );
  }

  return (
    <div className="dispute-page">
      {/* TX Modal */}
      {showTxModal && (
        <TransactionModal
          title="Transaction en cours..."
          description="Approbation dans votre wallet..."
          onComplete={view === 'form' ? handleDisputeConfirmed : handleArbiterConfirmed}
          onClose={() => setShowTxModal(false)}
        />
      )}

      <button className="btn btn-ghost" onClick={() => navigate(`/app/escrow/${id}`)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Retour au détail
      </button>

      {/* FORM VIEW */}
      {view === 'form' && (
        <motion.div
          className="dispute-form card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ marginBottom: 8 }}>Ouvrir un litige</h1>
          <p className="text-secondary" style={{ marginBottom: 20 }}>
            Escrow <strong>#{escrow.id}</strong> — {escrow.title}
          </p>

          <div className="danger-box" style={{ marginBottom: 24 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              L'ouverture d'un litige gèle les fonds jusqu'à la décision de l'arbitre
              {escrow.arbiter && <> (<span className="text-mono">{escrow.arbiter}</span>)</>}.
              <strong> Cette action est irréversible.</strong>
            </span>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Raison du litige *</label>
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Sélectionner une raison...</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Description détaillée *</label>
            <textarea
              className="input"
              placeholder="Expliquez votre situation en détail..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{ minHeight: 120 }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: 24 }}>
            <label>Preuves / Liens (optionnel)</label>
            <input
              className="input"
              placeholder="https://..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>

          <div className="step-actions">
            <button className="btn btn-secondary" onClick={() => navigate(`/app/escrow/${id}`)}>
              Annuler
            </button>
            <button
              className="btn btn-danger"
              disabled={!reason || !details.trim()}
              onClick={handleSubmitDispute}
            >
              <AlertTriangle size={16} /> Confirmer le litige
            </button>
          </div>
        </motion.div>
      )}

      {/* SUBMITTED VIEW */}
      {view === 'submitted' && (
        <motion.div
          className="dispute-submitted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card" style={{ marginBottom: 20, padding: 24 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 style={{ marginBottom: 2 }}>Litige en cours</h2>
                <p className="text-secondary text-sm">L'arbitre a été notifié. Les fonds restent verrouillés.</p>
              </div>
            </div>

            <div className="info-box" style={{ marginBottom: 20 }}>
              <Scale size={16} style={{ flexShrink: 0 }} />
              <span>L'arbitre examinera les arguments des deux parties et rendra sa décision.</span>
            </div>

            {/* Arguments display */}
            <div className="dispute-arguments">
              <div className="dispute-arg-card">
                <div className="dispute-arg-header-full">
                  <span className="dispute-arg-role">Argument du Client</span>
                </div>
                <p className="dispute-arg-body">
                  {escrow.dispute?.clientArgument || (
                    <span className="text-secondary" style={{ fontStyle: 'italic' }}>
                      {currentRole === 'client' ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => {}}>Ajouter votre argument →</button>
                      ) : 'En attente de réponse'}
                    </span>
                  )}
                </p>
                {escrow.dispute?.evidence && (
                  <a href={escrow.dispute.evidence} target="_blank" rel="noreferrer" className="text-sm" style={{ marginTop: 8, display: 'block' }}>
                    Preuve : {escrow.dispute.evidence}
                  </a>
                )}
              </div>

              <div className="dispute-arg-card">
                <div className="dispute-arg-header-full">
                  <span className="dispute-arg-role">Argument du Freelance</span>
                </div>
                {escrow.dispute?.freelanceArgument ? (
                  <p className="dispute-arg-body">{escrow.dispute.freelanceArgument}</p>
                ) : (
                  <div className="dispute-arg-body">
                    {currentRole === 'freelance' ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          className="input"
                          placeholder="Répondez à l'argument du client..."
                          value={freelanceResponse}
                          onChange={(e) => setFreelanceResponse(e.target.value)}
                          style={{ minHeight: 80 }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!freelanceResponse.trim()}
                          onClick={handleFreelanceRespond}
                        >
                          <Send size={14} /> Envoyer ma réponse
                        </button>
                      </div>
                    ) : (
                      <span className="text-secondary" style={{ fontStyle: 'italic' }}>En attente de réponse</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className="btn btn-ghost" onClick={() => navigate(`/app/escrow/${id}`)}>
            <ArrowLeft size={16} /> Retour au détail de l'escrow
          </button>
        </motion.div>
      )}

      {/* ARBITER VIEW */}
      {view === 'arbiter' && (
        <motion.div
          className="arbiter-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--info-light)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: 24 }}>Arbitrage — #{escrow.id}</h1>
                <p className="text-secondary">{escrow.title}</p>
              </div>
            </div>

            {/* Contract summary */}
            <div className="arbiter-summary">
              <div className="arbiter-summary-row">
                <span className="text-secondary">Montant</span>
                <span className="text-mono" style={{ fontWeight: 600 }}>{escrow.amount} ALPH</span>
              </div>
              <div className="arbiter-summary-row">
                <span className="text-secondary">Client</span>
                <span className="text-mono text-sm">{escrow.role === 'client' ? '0x7a3f...2d5e' : escrow.counterparty}</span>
              </div>
              <div className="arbiter-summary-row">
                <span className="text-secondary">Freelance</span>
                <span className="text-mono text-sm">{escrow.role === 'freelance' ? '0x7a3f...2d5e' : escrow.counterparty}</span>
              </div>
              <div className="arbiter-summary-row">
                <span className="text-secondary">Deadline</span>
                <span>{new Date(escrow.deadline).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />

            {/* Arguments */}
            <h3 style={{ marginBottom: 16 }}>Arguments des parties</h3>
            <div className="dispute-arguments">
              <div className="dispute-arg-card">
                <div className="dispute-arg-header-full"><span className="dispute-arg-role">Client</span></div>
                <p className="dispute-arg-body">{escrow.dispute?.clientArgument || 'Aucun argument fourni.'}</p>
              </div>
              <div className="dispute-arg-card">
                <div className="dispute-arg-header-full"><span className="dispute-arg-role">Freelance</span></div>
                <p className="dispute-arg-body">{escrow.dispute?.freelanceArgument || 'Aucun argument fourni.'}</p>
              </div>
            </div>

            <div className="divider" style={{ margin: '24px 0' }} />

            {/* Decision */}
            <h3 style={{ marginBottom: 16 }}>Votre décision</h3>
            <div className="arbiter-decisions">
              <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={() => handleArbiterDecision('freelance')}>
                <Check size={18} /> Fonds au freelance
              </button>
              <button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={() => handleArbiterDecision('client')}>
                <ArrowLeft size={18} /> Fonds au client
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
