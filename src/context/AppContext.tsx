import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { mockWallet, mockEscrows, mockTimelineEvents, type Wallet, type Escrow, type TimelineEvent } from '../data/mock';

interface AppState {
  wallet: Wallet | null;
  isConnected: boolean;
  escrows: Escrow[];
  timelineEvents: Record<string, TimelineEvent[]>;
  showWalletModal: boolean;
  showOnboarding: boolean;
  currentRole: 'client' | 'freelance' | 'arbiter';
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setShowWalletModal: (show: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  setCurrentRole: (role: 'client' | 'freelance' | 'arbiter') => void;
  updateEscrow: (id: string, updates: Partial<Escrow>) => void;
  addEscrow: (escrow: Escrow) => void;
  addTimelineEvent: (escrowId: string, event: TimelineEvent) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>(mockEscrows);
  const [timelineEvents, setTimelineEvents] = useState(mockTimelineEvents);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentRole, setCurrentRole] = useState<'client' | 'freelance' | 'arbiter'>('client');

  const connectWallet = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setWallet(mockWallet);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
  }, []);

  const updateEscrow = useCallback((id: string, updates: Partial<Escrow>) => {
    setEscrows((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const addEscrow = useCallback((escrow: Escrow) => {
    setEscrows((prev) => [escrow, ...prev]);
  }, []);

  const addTimelineEvent = useCallback((escrowId: string, event: TimelineEvent) => {
    setTimelineEvents((prev) => ({
      ...prev,
      [escrowId]: [...(prev[escrowId] || []), event],
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        wallet,
        isConnected: wallet !== null,
        escrows,
        timelineEvents,
        showWalletModal,
        showOnboarding,
        currentRole,
        connectWallet,
        disconnectWallet,
        setShowWalletModal,
        setShowOnboarding,
        setCurrentRole,
        updateEscrow,
        addEscrow,
        addTimelineEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
