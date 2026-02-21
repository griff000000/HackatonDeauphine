import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { CreateEscrow } from './pages/CreateEscrow';
import { EscrowDetail } from './pages/EscrowDetail';
import { DisputePage } from './pages/DisputePage';
import { WalletModal } from './components/WalletModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isConnected, setShowWalletModal } = useApp();
  if (!isConnected) {
    setTimeout(() => setShowWalletModal(true), 100);
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { showWalletModal, setShowWalletModal } = useApp();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="create" element={<CreateEscrow />} />
          <Route path="escrow/:id" element={<EscrowDetail />} />
          <Route path="escrow/:id/dispute" element={<DisputePage />} />
        </Route>
      </Routes>
      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
