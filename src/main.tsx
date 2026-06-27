import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor: attach the session token to every same-origin /api
// request so the back-end can authenticate the caller. Centralised here so each
// component doesn't have to remember to set the Authorization header.
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input :
    input instanceof URL ? input.pathname :
    input.url;

  if (url && url.startsWith('/api')) {
    try {
      const stored = localStorage.getItem('donor_alert_session');
      if (stored) {
        const token = JSON.parse(stored)?.token;
        if (token) {
          const headers = new Headers(
            init?.headers || (input instanceof Request ? input.headers : undefined)
          );
          if (!headers.has('Authorization')) {
            headers.set('Authorization', token);
            init = { ...init, headers };
          }
        }
      }
    } catch {
      // Ignore malformed session storage — request proceeds unauthenticated.
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
