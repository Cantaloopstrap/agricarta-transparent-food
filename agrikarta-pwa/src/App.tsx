import React, { useState } from 'react';
import { PremiumDashboard } from './components/PremiumDashboard';
import { PetaniDashboard } from './components/PetaniDashboard';
import { DistributorDashboard } from './components/DistributorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Sparkles, Sprout, Truck, ShieldAlert, LayoutDashboard, Database } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'premium' | 'petani' | 'distributor' | 'admin'>('premium');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('premium')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Database className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white">AgriCarta</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                PWA Platform
              </span>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('premium')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'premium'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">UI 04 - Premium</span>
            </button>

            <button
              onClick={() => setActiveTab('petani')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'petani'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span className="hidden sm:inline">UI 02 - Petani</span>
            </button>

            <button
              onClick={() => setActiveTab('distributor')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'distributor'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">UI 03 - Distributor</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">UI 05 - Admin</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main App Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'premium' && <PremiumDashboard />}
        {activeTab === 'petani' && <PetaniDashboard />}
        {activeTab === 'distributor' && <DistributorDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>© 2026 AgriCarta Platform — Transparent Food Price Intelligence Microservices.</p>
      </footer>
    </div>
  );
};

export default App;
