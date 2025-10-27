import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/Authpage.tsx';
import DashboardPage from './components/DashboardPage.tsx';
import DebugDashboard from './components/DebugDashboard.tsx';

function App() {
  return (
    <Router>
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
