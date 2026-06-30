import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor: attach the session token to every API request so the
// back-end can authenticate the caller. Centralised here so each component doesn't
// have to remember to set the Authorization header. Matches both the relative
// '/api' path (local dev) and the absolute Railway origin (production, when
// VITE_API_URL is set and the frontend calls the backend directly).
const API_ORIGIN = (import.meta.env.VITE_API_URL || '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const isApiRequest = (u: string): boolean =>
  !!u && (u.startsWith('/api') || (!!API_ORIGIN && u.startsWith(`${API_ORIGIN}/api`)));

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input :
    input instanceof URL ? input.href :
    input.url;

  let tokenAttached = false;
  if (isApiRequest(url)) {
    try {
      const stored = localStorage.getItem('donor_alert_session');
      if (stored) {
        const token = JSON.parse(stored)?.token;
        if (token) {
          tokenAttached = true;
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

  const result = originalFetch(input, init);

  // Self-heal expired/invalid sessions: when an AUTHENTICATED API call comes back 401
  // (e.g. the server restarted with a fresh SESSION_SECRET), the stored token is dead.
  // Drop it and tell the app to show the login screen instead of an empty dashboard.
  // Login/registration endpoints are excluded so their own 401s (wrong password etc.)
  // don't trigger a logout.
  if (tokenAttached && !url.includes('/auth/')) {
    return result.then(res => {
      if (res.status === 401) {
        try { localStorage.removeItem('donor_alert_session'); } catch {}
        window.dispatchEvent(new Event('sessionExpired'));
      }
      return res;
    });
  }

  return result;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
