import React, { useState, useEffect } from 'react';

interface ServiceHealth { name: string; status: 'healthy' | 'degraded' | 'down'; uptime: string; endpoint: string; latency?: number; }
interface UserRow { id: string; name: string; wa: string; isPremium: boolean; joinedDate: string; }
interface CommodityEntry { id: number; name: string; emoji: string; lastPrice: number; updated: string; }
interface AdminDashboardProps { onBack: () => void; }

type AdminTab = 'overview' | 'users' | 'commodities' | 'services' | 'reports';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  const [services] = useState<ServiceHealth[]>([
    { name: 'Backend API', status: 'healthy', uptime: '99.8%', endpoint: 'localhost:5000', latency: 45 },
    { name: 'ML Engine', status: 'healthy', uptime: '97.2%', endpoint: 'localhost:8000', latency: 120 },
    { name: 'WhatsApp Bot', status: 'degraded', uptime: '94.5%', endpoint: 'Baileys WS', latency: 250 },
    { name: 'Supabase DB', status: 'healthy', uptime: '99.9%', endpoint: 'supabase.co', latency: 30 },
  ]);

  const [users] = useState<UserRow[]>([
    { id: 'u1', name: 'Budi Santoso', wa: '6281234567890', isPremium: true, joinedDate: '2026-01-15' },
    { id: 'u2', name: 'Sri Wahyuni', wa: '6289876543210', isPremium: false, joinedDate: '2026-03-22' },
    { id: 'u3', name: 'Ahmad Fauzi', wa: '6285551234567', isPremium: true, joinedDate: '2026-05-10' },
    { id: 'u4', name: 'Dewi Lestari', wa: '6287771112222', isPremium: false, joinedDate: '2026-06-01' },
    { id: 'u5', name: 'Sujatmiko', wa: '6281119998877', isPremium: true, joinedDate: '2026-06-18' },
  ]);

  const [commodities] = useState<CommodityEntry[]>([
    { id: 1, name: 'Beras Medium', emoji: '🍚', lastPrice: 14500, updated: '2026-07-24' },
    { id: 2, name: 'Cabai Merah', emoji: '🌶️', lastPrice: 38000, updated: '2026-07-24' },
    { id: 3, name: 'Bawang Merah', emoji: '🧅', lastPrice: 32000, updated: '2026-07-24' },
    { id: 4, name: 'Jagung Pipilan', emoji: '🌽', lastPrice: 5200, updated: '2026-07-23' },
    { id: 5, name: 'Minyak Goreng', emoji: '🫗', lastPrice: 17500, updated: '2026-07-23' },
    { id: 6, name: 'Padi Gabah', emoji: '🌾', lastPrice: 6800, updated: '2026-07-22' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const statusBadge = (s: ServiceHealth['status']) => {
    const map = {
      healthy: 'bg-agri-forest text-white',
      degraded: 'bg-agri-amber text-agri-dark',
      down: 'bg-red-600 text-white',
    };
    return `${map[s]} px-3 py-1 rounded-md font-black text-xs border-2 border-agri-dark uppercase`;
  };

  const sidebarItems: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '🏠' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'commodities', label: 'Komoditas', icon: '📦' },
    { key: 'services', label: 'Services', icon: '🔧' },
    { key: 'reports', label: 'Reports', icon: '📊' },
  ];

  return (
    <div className="flex min-h-screen bg-agri-cream text-agri-dark">

      {/* ═══ Sidebar — Neobrutalism ═══ */}
      <aside className="w-64 bg-agri-dark text-white flex flex-col border-r-4 border-agri-dark shrink-0">
        <div className="p-4 flex items-center gap-3 border-b-4 border-white/10">
          <div className="w-8 h-8 rounded-lg bg-agri-amber border-2 border-agri-dark flex items-center justify-center shadow-brutal-sm">
            <span className="text-agri-dark font-black text-sm">A</span>
          </div>
          <div>
            <h2 className="font-black text-sm tracking-wide">AGRIKARTA</h2>
            <p className="text-xs text-white/50 font-medium">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-all flex items-center gap-3 ${
                activeTab === item.key
                  ? 'bg-agri-amber text-agri-dark shadow-brutal-sm border-2 border-agri-dark'
                  : 'text-white/70 hover:bg-white/10 hover:text-white border-2 border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t-4 border-white/10">
          <button
            onClick={onBack}
            className="w-full text-left px-4 py-3 rounded-lg font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
          >
            <span>←</span>
            <span>Kembali ke App</span>
          </button>
        </div>
      </aside>

      {/* ═══ Main Admin Content ═══ */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-black tracking-tight">Admin Overview</h1>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: users.length, icon: '👥' },
                { label: 'Premium Users', value: users.filter(u => u.isPremium).length, icon: '⭐' },
                { label: 'Komoditas Aktif', value: commodities.length, icon: '📦' },
                { label: 'Services Up', value: services.filter(s => s.status === 'healthy').length + '/' + services.length, icon: '✅' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 border-4 border-agri-dark rounded-xl shadow-brutal-sm">
                  <p className="text-xs font-black text-agri-dark/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-4xl font-black text-agri-dark mt-2">{stat.value}</p>
                  <p className="text-2xl mt-1">{stat.icon}</p>
                </div>
              ))}
            </div>

            {/* Quick Service Status */}
            <div className="bg-white p-6 border-4 border-agri-dark rounded-xl shadow-brutal-card">
              <h2 className="font-black text-xl mb-4">Service Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((s, i) => (
                  <div key={i} className="bg-agri-cream border-2 border-agri-dark rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-black text-agri-dark">{s.name}</p>
                      <p className="text-xs text-agri-dark/60 font-medium">{s.endpoint} · {s.latency}ms</p>
                    </div>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">User Management</h1>
            <div className="bg-white border-4 border-agri-dark rounded-xl overflow-hidden shadow-brutal-card">
              <table className="w-full">
                <thead>
                  <tr className="bg-agri-cream border-b-4 border-agri-dark text-left text-sm font-black">
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">WhatsApp</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b-2 border-agri-dark">
                        <td className="px-6 py-4"><div className="h-5 w-32 bg-agri-cream animate-pulse rounded" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-40 bg-agri-cream animate-pulse rounded" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-20 bg-agri-cream animate-pulse rounded mx-auto" /></td>
                        <td className="px-6 py-4"><div className="h-5 w-24 bg-agri-cream animate-pulse rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="border-b-2 border-agri-dark hover:bg-agri-cream/30 transition-colors">
                        <td className="px-6 py-4 font-bold">{u.name}</td>
                        <td className="px-6 py-4 font-medium text-agri-dark/70">{u.wa}</td>
                        <td className="px-6 py-4 text-center">
                          {u.isPremium ? (
                            <span className="bg-agri-amber text-agri-dark font-black px-3 py-1 rounded-md border-2 border-agri-dark text-xs">⭐ PREMIUM</span>
                          ) : (
                            <span className="bg-white text-agri-dark/70 font-bold px-3 py-1 rounded-md border-2 border-agri-dark text-xs">FREE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-agri-dark/60">{u.joinedDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commodities Tab */}
        {activeTab === 'commodities' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">Master Komoditas</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {commodities.map(c => (
                <div key={c.id} className="bg-white p-6 border-4 border-agri-dark rounded-xl shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal-base transition-all">
                  <div className="text-4xl mb-3">{c.emoji}</div>
                  <h3 className="font-black text-xl text-agri-dark">{c.name}</h3>
                  <p className="text-2xl font-black text-agri-forest mt-2">Rp {c.lastPrice.toLocaleString('id-ID')}</p>
                  <p className="text-xs text-agri-dark/50 font-bold mt-1">ID: {c.id} · Updated: {c.updated}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">Service Health Monitor</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((s, i) => (
                <div key={i} className="bg-white border-4 border-agri-dark rounded-xl p-6 shadow-brutal-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl text-agri-dark">{s.name}</h3>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-agri-dark/80">
                      <span>Endpoint</span>
                      <span className="font-mono">{s.endpoint}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-agri-dark/80">
                      <span>Uptime</span>
                      <span>{s.uptime}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-agri-dark/80">
                      <span>Latency</span>
                      <span>{s.latency}ms</span>
                    </div>
                  </div>
                  {/* Uptime bar */}
                  <div className="mt-4 bg-agri-cream border-2 border-agri-dark h-4 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full ${s.status === 'healthy' ? 'bg-agri-forest' : s.status === 'degraded' ? 'bg-agri-amber' : 'bg-red-600'}`}
                      style={{ width: s.uptime }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight">Reports & Analytics</h1>
            <div className="bg-white border-4 border-agri-dark rounded-xl p-8 shadow-brutal-card flex flex-col items-center justify-center h-64">
              <span className="text-6xl mb-4">📊</span>
              <h3 className="text-xl font-black text-agri-dark">Analytics Dashboard</h3>
              <p className="text-agri-dark/60 font-medium mt-2 text-center max-w-sm">
                Modul reporting akan menampilkan analitik penggunaan platform, tren harga historis, dan statistik bot WhatsApp. Coming soon.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
