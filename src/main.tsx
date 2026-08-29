import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { HistoryProvider } from './context/HistoryContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HistoryProvider>
        <App />
      </HistoryProvider>
    </AuthProvider>
  </StrictMode>
);