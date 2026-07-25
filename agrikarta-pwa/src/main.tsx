import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWA Service Worker Registration (auto-update)
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update: apply new service worker immediately
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[AgriCarta PWA] App ready for offline use.');
  },
  onRegisteredSW(swUrl?: string, registration?: ServiceWorkerRegistration) {
    console.log(`[AgriCarta PWA] Service Worker registered: ${swUrl}`);
    // Check for updates every hour
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error: unknown) {
    console.error('[AgriCarta PWA] Service Worker registration failed:', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
