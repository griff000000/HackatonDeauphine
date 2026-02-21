import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { EscrowCard } from '../components/EscrowCard';
import { Activity, Lock, CheckCircle, AlertTriangle, Plus, Inbox } from 'lucide-react';

import './Dashboard.css';

type FilterTab = 'all' | 'active' | 'completed' | 'disputed';

export function Dashboard() {
  const { escrows } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const navigate = useNavigate();

  const stats = useMemo(() => ({
    active: escrows.filter((e) => ['active', 'pending', 'delivered'].includes(e.status)).length,
    locked: escrows.filter((e) => ['active', 'pending', 'delivered', 'disputed'].includes(e.status))
      .reduce((sum, e) => sum + e.amount, 0),
    completed: escrows.filter((e) => e.status === 'completed').length,
    disputed: escrows.filter((e) => e.status === 'disputed').length,
  }), [escrows]);

  const filteredEscrows = useMemo(() => {
    switch (activeTab) {
      case 'active': return escrows.filter((e) => ['active', 'pending', 'delivered'].includes(e.status));
      case 'completed': return escrows.filter((e) => ['completed', 'refunded', 'expired'].includes(e.status));
      case 'disputed': return escrows.filter((e) => e.status === 'disputed');
      default: return escrows;
    }
  }, [escrows, activeTab]);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: escrows.length },
    { key: 'active', label: 'En cours', count: stats.active },
    { key: 'completed', label: 'Terminés', count: stats.completed },
    { key: 'disputed', label: 'Litiges', count: stats.disputed },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">Vue d'ensemble de vos escrows</p>
        </div>
        <button className="btn btn-primary" data-tour="create-btn" onClick={() => navigate('/app/create')}>
          <Plus size={16} /> Créer un Escrow
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid grid grid-4 gap-4" data-tour="stats">
        {[
          { icon: <Activity size={20} />, label: 'Escrows actifs', value: stats.active, color: 'var(--info)' },
          { icon: <Lock size={20} />, label: 'Volume verrouillé', value: `${stats.locked.toLocaleString()} ALPH`, color: 'var(--warning)' },
          { icon: <CheckCircle size={20} />, label: 'Escrows complétés', value: stats.completed, color: 'var(--success)' },
          { icon: <AlertTriangle size={20} />, label: 'Litiges en cours', value: stats.disputed, color: 'var(--danger)' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="stat-card card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="stat-icon" style={{ background: stat.color + '20', color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <span className="stat-value text-mono">{stat.value}</span>
              <span className="stat-label text-secondary text-sm">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs" data-tour="filters">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`dashboard-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Escrow List */}
      {filteredEscrows.length > 0 ? (
        <div className="escrow-list">
          {filteredEscrows.map((escrow, index) => (
            <EscrowCard key={escrow.id} escrow={escrow} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Inbox size={56} strokeWidth={1} className="empty-icon" />
          <h3>Aucun escrow pour le moment</h3>
          <p className="text-secondary">Créez votre premier escrow sécurisé en quelques clics.</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/create')}>
            <Plus size={16} /> Créer un Escrow
          </button>
        </motion.div>
      )}
    </div>
  );
}
