import { type EscrowStatus, statusLabels } from '../data/mock';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: EscrowStatus;
}

const statusIcons: Record<EscrowStatus, string> = {
  pending: '🟡',
  active: '🔵',
  delivered: '📦',
  disputed: '🔴',
  completed: '🟢',
  refunded: '⚪',
  expired: '🟠',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {statusIcons[status]} {statusLabels[status]}
    </span>
  );
}
