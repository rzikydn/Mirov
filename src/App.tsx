import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WorkspacePreview from './components/WorkspacePreview';
import Features from './components/Features';
import Workflow from './components/Workflow';
import Integrations from './components/Integrations';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import AuthPage from './components/Authpage.tsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-white">
              <Navbar />
              <Hero />
              <WorkspacePreview />
              <Features />
              <Workflow />
              <Integrations />
              <FinalCTA />
              <Footer />
            </div>
          }
        />

        {/* Auth Page */}
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
