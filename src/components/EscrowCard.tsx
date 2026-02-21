import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type Escrow, statusColors, roleLabels } from '../data/mock';
import { StatusBadge } from './StatusBadge';
import { ArrowRight, Clock } from 'lucide-react';
import './EscrowCard.css';

interface EscrowCardProps {
  escrow: Escrow;
  index: number;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 30) return `${Math.floor(days / 30)} mois`;
  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return "à l'instant";
}

function daysUntil(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Expiré';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `dans ${days} jours`;
}

export function EscrowCard({ escrow, index }: EscrowCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="escrow-card card card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={() => navigate(`/app/escrow/${escrow.id}`)}
      style={{ '--status-color': statusColors[escrow.status] } as React.CSSProperties}
      {...(index === 0 ? { 'data-tour': 'escrow-card' } : {})}
    >
      <div className="escrow-card-header">
        <StatusBadge status={escrow.status} />
        <span className="text-sm text-secondary">{timeAgo(escrow.createdAt)}</span>
      </div>

      <h3 className="escrow-card-title">{escrow.title}</h3>

      <div className="escrow-card-details">
        <div className="escrow-card-detail">
          <span className="text-secondary text-sm">Montant</span>
          <span className="escrow-card-amount">{escrow.amount.toLocaleString()} {escrow.token}</span>
        </div>
        <div className="escrow-card-detail">
          <span className="text-secondary text-sm">Contrepartie</span>
          <span className="text-mono text-sm">{escrow.counterparty}</span>
        </div>
        <div className="escrow-card-detail">
          <span className="text-secondary text-sm">Deadline</span>
          <span className="text-sm flex items-center gap-1">
            <Clock size={12} />
            {daysUntil(escrow.deadline)}
          </span>
        </div>
        <div className="escrow-card-detail">
          <span className="text-secondary text-sm">Votre rôle</span>
          <span className="text-sm" style={{ fontWeight: 500 }}>{roleLabels[escrow.role]}</span>
        </div>
      </div>

      {escrow.status === 'active' && (
        <div className="escrow-card-progress">
          <div className="progress-bar">
            <motion.div
              className="progress-bar-fill"
              style={{ background: statusColors[escrow.status] }}
              initial={{ width: 0 }}
              animate={{ width: `${escrow.progress}%` }}
              transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm text-secondary">{escrow.progress}% du temps écoulé</span>
        </div>
      )}

      <div className="escrow-card-footer">
        <span className="escrow-card-link">
          Voir détail <ArrowRight size={14} />
        </span>
      </div>
    </motion.div>
  );
}
