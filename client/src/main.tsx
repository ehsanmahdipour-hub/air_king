import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { AuthProvider } from './app/auth/AuthContext';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root was not found in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
