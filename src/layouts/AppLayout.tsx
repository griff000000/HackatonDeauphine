import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { OnboardingTour } from '../components/OnboardingTour';
import { LayoutDashboard, Plus, Wallet, LogOut, HelpCircle } from 'lucide-react';
import './AppLayout.css';

export function AppLayout() {
  const { wallet, disconnectWallet, currentRole, setCurrentRole, showOnboarding, setShowOnboarding } = useApp();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo" onClick={() => navigate('/app')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">A</span> AlphTrust
          </span>
          <nav className="app-nav">
            <NavLink to="/app" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink to="/app/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Plus size={16} /> Créer
            </NavLink>
          </nav>
        </div>

        <div className="app-header-right">
          {/* Role switcher */}
          <div className="role-switcher" data-tour="role-switcher">
            {(['client', 'freelance', 'arbiter'] as const).map((role) => (
              <button
                key={role}
                className={`role-btn ${currentRole === role ? 'active' : ''}`}
                onClick={() => setCurrentRole(role)}
              >
                {role === 'client' ? 'Client' : role === 'freelance' ? 'Freelance' : 'Arbitre'}
              </button>
            ))}
          </div>

          {/* Help / onboarding button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowOnboarding(true)}
            title="Guide d'utilisation"
            style={{ gap: 4 }}
            data-tour="guide-btn"
          >
            <HelpCircle size={16} /> Guide
          </button>

          {/* Wallet info */}
          {wallet && (
            <div className="wallet-info">
              <Wallet size={14} />
              <span className="text-mono text-sm">{wallet.address}</span>
              <span className="wallet-balance">{wallet.balance.toLocaleString()} ALPH</span>
            </div>
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => { disconnectWallet(); navigate('/'); }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
