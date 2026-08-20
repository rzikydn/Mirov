import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthPage from './components/Authpage.tsx';
import DashboardPage from './components/DashboardPage.tsx';
import ChatbotAdminPage from './components/ChatbotAdminPage.tsx';
import DebugDashboard from './components/DebugDashboard.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';

import { useEffect } from 'react';
import { recordNewInteraction } from './services/chatbotAnalytics';

import WidgetOnlyPage from './components/WidgetOnlyPage.tsx';

function App() {
  // KPI 1 & KPI 4: Catat setiap pengunjung yang mengakses domain bsmr.org
  useEffect(() => {
    if (!sessionStorage.getItem('bsmr_domain_visit_recorded')) {
      sessionStorage.setItem('bsmr_domain_visit_recorded', 'true');
      recordNewInteraction();
    }
  }, []);
  return (
    <Router>
      <OfflineBanner />
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
        {/* Standalone Embeddable Widget Route */}
        <Route path="/widget-only" element={<WidgetOnlyPage />} />
        <Route path="/widget" element={<WidgetOnlyPage />} />

        {/* Default route menuju ke /auth */}
        <Route path="/" element={<Navigate to="/auth" />} />

        {/* Halaman Auth (Login & Register) */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth" />} />

        {/* Debug Dashboard */}
        <Route path="/debug" element={<DebugDashboard />} />

        {/* Halaman Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Halaman Chatbot Admin Dedicated Page */}
        <Route path="/chatbot-admin" element={<ChatbotAdminPage />} />
        <Route path="/chatbot" element={<ChatbotAdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
