import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/Authpage.tsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Page (Login & Register) */}
        <Route path="/" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}


export default App;
