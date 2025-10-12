import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WorkspacePreview from './components/WorkspacePreview';
import Features from './components/Features';
import Workflow from './components/Workflow';
import Integrations from './components/Integrations';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

function App() {
  return (
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
  );
}

export default App;
