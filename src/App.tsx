import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AuthPage from './components/Authpage.tsx';
import DashboardPage from './components/DashboardPage.tsx';
import DebugDashboard from './components/DebugDashboard.tsx';

function App() {
  return (
    <Router>
      <Analytics />
      <SpeedInsights />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Default route menuju ke /auth */}
        <Route path="/" element={<Navigate to="/auth" />} />

        {/* Halaman Auth (Login & Register) */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" />} />

        {/* Debug Dashboard */}
        <Route path="/debug" element={<DebugDashboard />} />

        {/* Halaman Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
