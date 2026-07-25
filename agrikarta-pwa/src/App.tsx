import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { PremiumDashboard } from './components/PremiumDashboard';
import { PetaniDashboard } from './components/PetaniDashboard';
import { DistributorDashboard } from './components/DistributorDashboard';
import { AdminDashboard } from './components/AdminDashboard';

type TabKey = 'landing' | 'premium' | 'petani' | 'distributor' | 'admin';

const BACKEND_URL = 'http://localhost:5000';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('landing');
  const [isPremium, setIsPremium] = useState(false);

  /* ═══ Magic Link Token Handler (Fitur 4 spec) ═══ */
  /* On mount: parse ?token= from URL, validate JWT via backend, set premium state */
  useEffect(() => {
    // Check if already premium from localStorage
    const storedPremium = localStorage.getItem('agrikarta_is_premium');
    if (storedPremium === 'true') {
      setIsPremium(true);
    }

    // Parse ?token= query parameter from Magic Link (Fitur 4 Step 7)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Validate token via backend
      (async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.valid && result.tier === 'premium') {
              setIsPremium(true);
              localStorage.setItem('agrikarta_is_premium', 'true');
              localStorage.setItem('agrikarta_token', token);
              setActiveTab('premium');
            }
          }
        } catch {
          // Backend not available — fallback: decode JWT client-side to check tier
          try {
            const payloadB64 = token.split('.')[1];
            if (payloadB64) {
              const payload = JSON.parse(atob(payloadB64));
              if (payload.tier === 'premium') {
                setIsPremium(true);
                localStorage.setItem('agrikarta_is_premium', 'true');
                localStorage.setItem('agrikarta_token', token);
                setActiveTab('premium');
              }
            }
          } catch {
            console.error('Invalid Magic Link token');
          }
        }

        // Clean URL query parameter after processing
        window.history.replaceState({}, document.title, window.location.pathname);
      })();
    }
  }, []);

  const handleLogout = () => {
    setIsPremium(false);
    localStorage.removeItem('agrikarta_is_premium');
    localStorage.removeItem('agrikarta_token');
    setActiveTab('landing');
  };

  // UI 05: Admin has its own full-screen layout with sidebar — NO global navbar
  if (activeTab === 'admin') {
    return (
      <AdminDashboard onBack={() => setActiveTab('landing')} />
    );
  }

  return (
    <div className="min-h-screen bg-agri-cream text-agri-dark flex flex-col">

      {/* ═══ Global Navbar (Shared Component — Neobrutalism, Global Design System spec) ═══ */}
      {/* Container: fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center bg-agri-dark border-b-4 border-agri-dark */}
      <header className="fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center bg-agri-dark border-b-4 border-agri-dark">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setActiveTab('landing')}
        >
          {/* Logo Mark */}
          <div className="w-9 h-9 rounded-lg bg-agri-amber border-2 border-agri-dark flex items-center justify-center shadow-brutal-sm">
            <svg className="w-5 h-5 text-agri-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="6" rx="8" ry="3"/>
              <path d="M4,6 v4 c0,1.66 3.58,3 8,3 s8,-1.34 8,-3 v-4"/>
              <path d="M4,10 v4 c0,1.66 3.58,3 8,3 s8,-1.34 8,-3 v-4"/>
              <path d="M4,14 v4 c0,1.66 3.58,3 8,3 s8,-1.34 8,-3 v-4"/>
            </svg>
          </div>
          {/* Logo text (Global Design spec: text-white font-black text-2xl tracking-tight) */}
          <span className="text-white font-black text-2xl tracking-tight">AgriCarta</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {([
            { key: 'landing' as TabKey, label: 'Beranda' },
            { key: 'petani' as TabKey, label: 'Petani' },
            { key: 'distributor' as TabKey, label: 'Distributor' },
            { key: 'premium' as TabKey, label: '★ Premium' },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === item.key
                  ? 'bg-white text-agri-dark border-2 border-agri-dark shadow-brutal-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA Button (Global Design spec: bg-agri-amber text-agri-dark font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('admin')}
            className="hidden md:block text-white/60 hover:text-white text-xs font-bold transition-colors"
          >
            Admin
          </button>
          {isPremium ? (
            <button
              onClick={handleLogout}
              className="bg-white text-agri-dark font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all"
            >
              Keluar Akun
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('premium')}
              className="bg-agri-amber text-agri-dark font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all"
            >
              Beli Premium
            </button>
          )}
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-agri-dark border-t-4 border-agri-dark flex">
        {([
          { key: 'landing' as TabKey, label: '🏠' },
          { key: 'petani' as TabKey, label: '🌾' },
          { key: 'distributor' as TabKey, label: '🚛' },
          { key: 'premium' as TabKey, label: '⭐' },
          { key: 'admin' as TabKey, label: '🔒' },
        ]).map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`flex-1 py-3 text-xl transition-all ${
              activeTab === item.key
                ? 'bg-agri-amber text-agri-dark'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ═══ Main Content View ═══ */}
      <main className="flex-1 pt-[72px] pb-16 md:pb-0">
        {activeTab === 'landing' && <LandingPage onNavigate={setActiveTab} />}
        {activeTab === 'premium' && <PremiumDashboard />}
        {activeTab === 'petani' && <PetaniDashboard />}
        {activeTab === 'distributor' && <DistributorDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-agri-dark border-t-4 border-agri-dark py-6 px-6 text-center hidden md:block">
        <p className="text-white/60 text-sm font-bold">© 2026 AgriCarta — Transparent Food Price Intelligence Platform.</p>
      </footer>
    </div>
  );
};

export default App;
