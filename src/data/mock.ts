export type EscrowStatus = 'pending' | 'active' | 'delivered' | 'disputed' | 'completed' | 'refunded' | 'expired';
export type UserRole = 'client' | 'freelance' | 'arbiter';

export interface Wallet {
  address: string;
  displayAddress: string;
  balance: number;
  token: string;
}

export interface Dispute {
  openedBy: 'client' | 'freelance';
  reason: string;
  clientArgument: string;
  freelanceArgument: string | null;
  evidence?: string;
}

export interface Escrow {
  id: string;
  title: string;
  amount: number;
  token: string;
  status: EscrowStatus;
  role: UserRole;
  counterparty: string;
  arbiter: string | null;
  createdAt: string;
  deadline: string;
  completedAt?: string;
  progress: number;
  description: string;
  dispute?: Dispute;
  deliveryMessage?: string;
  deliveryLink?: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
  actor: 'client' | 'freelance' | 'arbiter' | 'system';
  icon: string;
  txHash?: string;
}

export const mockWallet: Wallet = {
  address: '0x7a3f8c2d1e5b9a4f6d0c3e8b7a1f2d5e',
  displayAddress: '0x7a3f...2d5e',
  balance: 1240.50,
  token: 'ALPH',
};

export const mockEscrows: Escrow[] = [
  {
    id: 'ESC-0042',
    title: 'Refonte UI Dashboard DeFi',
    amount: 500,
    token: 'ALPH',
    status: 'active',
    role: 'client',
    counterparty: '0x8b2e...4f1a',
    arbiter: '0x3c7d...9e5f',
    createdAt: '2025-02-21T14:32:00Z',
    deadline: '2025-02-25T23:59:00Z',
    progress: 65,
    description: "Refonte complète de l'interface utilisateur du dashboard analytics",
  },
  {
    id: 'ESC-0041',
    title: 'Smart Contract Audit',
    amount: 1200,
    token: 'ALPH',
    status: 'pending',
    role: 'freelance',
    counterparty: '0x1f4a...7c3b',
    arbiter: '0x3c7d...9e5f',
    createdAt: '2025-02-20T09:15:00Z',
    deadline: '2025-03-01T23:59:00Z',
    progress: 10,
    description: 'Audit de sécurité du smart contract de lending',
  },
  {
    id: 'ESC-0039',
    title: 'Logo & Brand Identity',
    amount: 200,
    token: 'ALPH',
    status: 'delivered',
    role: 'client',
    counterparty: '0x5d9e...2a8c',
    arbiter: null,
    createdAt: '2025-02-18T11:00:00Z',
    deadline: '2025-02-22T23:59:00Z',
    progress: 90,
    description: 'Création du logo et de la charte graphique complète',
    deliveryMessage: 'Voici les fichiers finaux du logo en plusieurs formats (SVG, PNG, PDF). La charte graphique est incluse.',
    deliveryLink: 'https://figma.com/file/abc123',
  },
  {
    id: 'ESC-0035',
    title: 'API Integration Backend',
    amount: 800,
    token: 'ALPH',
    status: 'disputed',
    role: 'freelance',
    counterparty: '0x4c6b...1d7e',
    arbiter: '0x9a2f...5e3d',
    createdAt: '2025-02-10T16:45:00Z',
    deadline: '2025-02-17T23:59:00Z',
    progress: 100,
    description: "Intégration de l'API CoinGecko + endpoints custom",
    dispute: {
      openedBy: 'client',
      reason: 'Travail non conforme au brief',
      clientArgument: "L'API ne gère pas les erreurs 429 comme spécifié dans le brief.",
      freelanceArgument: "Le rate limiting n'était pas dans le scope initial. J'ai livré tout ce qui était demandé.",
    },
  },
  {
    id: 'ESC-0030',
    title: 'Landing Page Crypto Startup',
    amount: 350,
    token: 'ALPH',
    status: 'completed',
    role: 'freelance',
    counterparty: '0x2e8a...6f4c',
    arbiter: null,
    createdAt: '2025-02-01T08:20:00Z',
    deadline: '2025-02-08T23:59:00Z',
    completedAt: '2025-02-06T17:30:00Z',
    progress: 100,
    description: "Page d'accueil responsive avec animations et formulaire",
  },
  {
    id: 'ESC-0028',
    title: 'Whitepaper Translation EN→FR',
    amount: 150,
    token: 'ALPH',
    status: 'expired',
    role: 'freelance',
    counterparty: '0x7f1c...3b9a',
    arbiter: null,
    createdAt: '2025-01-25T10:00:00Z',
    deadline: '2025-02-01T23:59:00Z',
    progress: 100,
    description: 'Traduction du whitepaper de 15 pages en français',
  },
];

export const mockTimelineEvents: Record<string, TimelineEvent[]> = {
  'ESC-0042': [
    { date: '2025-02-21T14:32:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-02-21T14:32:00Z', event: '500 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xa1b2c3d4e5f6...' },
    { date: '2025-02-21T15:01:00Z', event: 'Mission acceptée', actor: 'freelance', icon: 'accept' },
  ],
  'ESC-0041': [
    { date: '2025-02-20T09:15:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-02-20T09:15:00Z', event: '1200 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xb2c3d4e5f6a7...' },
  ],
  'ESC-0039': [
    { date: '2025-02-18T11:00:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-02-18T11:00:00Z', event: '200 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xc3d4e5f6a7b8...' },
    { date: '2025-02-18T12:30:00Z', event: 'Mission acceptée', actor: 'freelance', icon: 'accept' },
    { date: '2025-02-21T10:45:00Z', event: 'Livraison soumise', actor: 'freelance', icon: 'deliver' },
  ],
  'ESC-0035': [
    { date: '2025-02-10T16:45:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-02-10T16:45:00Z', event: '800 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xd4e5f6a7b8c9...' },
    { date: '2025-02-10T17:20:00Z', event: 'Mission acceptée', actor: 'freelance', icon: 'accept' },
    { date: '2025-02-15T09:00:00Z', event: 'Livraison soumise', actor: 'freelance', icon: 'deliver' },
    { date: '2025-02-16T14:30:00Z', event: 'Litige ouvert par le client', actor: 'client', icon: 'dispute' },
  ],
  'ESC-0030': [
    { date: '2025-02-01T08:20:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-02-01T08:20:00Z', event: '350 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xe5f6a7b8c9d0...' },
    { date: '2025-02-01T09:00:00Z', event: 'Mission acceptée', actor: 'freelance', icon: 'accept' },
    { date: '2025-02-05T16:00:00Z', event: 'Livraison soumise', actor: 'freelance', icon: 'deliver' },
    { date: '2025-02-06T17:30:00Z', event: 'Fonds libérés — 350 ALPH envoyés au freelance', actor: 'client', icon: 'release', txHash: '0xf6a7b8c9d0e1...' },
  ],
  'ESC-0028': [
    { date: '2025-01-25T10:00:00Z', event: 'Escrow créé', actor: 'client', icon: 'create' },
    { date: '2025-01-25T10:00:00Z', event: '150 ALPH déposés', actor: 'client', icon: 'deposit', txHash: '0xa7b8c9d0e1f2...' },
    { date: '2025-01-25T11:30:00Z', event: 'Mission acceptée', actor: 'freelance', icon: 'accept' },
    { date: '2025-01-30T14:00:00Z', event: 'Livraison soumise', actor: 'freelance', icon: 'deliver' },
    { date: '2025-02-01T23:59:00Z', event: 'Deadline expiré — auto-release disponible', actor: 'system', icon: 'expired' },
  ],
};

export const statusLabels: Record<EscrowStatus, string> = {
  pending: 'En attente',
  active: 'En cours',
  delivered: 'Livraison soumise',
  disputed: 'En litige',
  completed: 'Complété',
  refunded: 'Remboursé',
  expired: 'Expiré',
};

export const statusColors: Record<EscrowStatus, string> = {
  pending: 'var(--warning)',
  active: 'var(--info)',
  delivered: '#8B5CF6',
  disputed: 'var(--danger)',
  completed: 'var(--success)',
  refunded: 'var(--gray-400)',
  expired: '#F97316',
};

export const roleLabels: Record<UserRole, string> = {
  client: 'Client',
  freelance: 'Freelance',
  arbiter: 'Arbitre',
};
