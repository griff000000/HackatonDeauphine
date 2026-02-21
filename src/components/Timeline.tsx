import { motion } from 'framer-motion';
import { type TimelineEvent, statusColors } from '../data/mock';
import { Plus, ArrowDownCircle, CheckCircle, Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import './Timeline.css';

interface TimelineProps {
  events: TimelineEvent[];
}

const iconMap: Record<string, React.ReactNode> = {
  create: <Plus size={16} />,
  deposit: <ArrowDownCircle size={16} />,
  accept: <CheckCircle size={16} />,
  deliver: <Package size={16} />,
  dispute: <AlertTriangle size={16} />,
  release: <DollarSign size={16} />,
  expired: <Clock size={16} />,
  resolve: <CheckCircle size={16} />,
};

const iconColors: Record<string, string> = {
  create: statusColors.active,
  deposit: statusColors.active,
  accept: statusColors.completed,
  deliver: '#8B5CF6',
  dispute: statusColors.disputed,
  release: statusColors.completed,
  expired: '#F97316',
  resolve: statusColors.completed,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="timeline">
      {events.map((event, index) => (
        <motion.div
          key={index}
          className="timeline-item"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <div className="timeline-line">
            <div
              className="timeline-dot"
              style={{ background: iconColors[event.icon] || 'var(--gray-400)', color: '#fff' }}
            >
              {iconMap[event.icon] || <Plus size={16} />}
            </div>
            {index < events.length - 1 && <div className="timeline-connector" />}
          </div>
          <div className="timeline-content">
            <div className="timeline-event">{event.event}</div>
            <div className="timeline-meta">
              <span className="timeline-date">{formatDate(event.date)} à {formatTime(event.date)}</span>
              {event.txHash && (
                <a className="timeline-tx" href="#" onClick={(e) => e.preventDefault()}>
                  Tx: {event.txHash}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
