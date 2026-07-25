import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LogEntry { id: number; timestamp: string; message: string; source: string; }
interface UserRow { id: string; name: string; wa: string; role: string; isPremium: boolean; statusActive: boolean; joinedDate: string; banState: 'active' | 'banning' | 'banned'; }
interface AdminDashboardProps { onBack: () => void; }

type AdminTab = 'dashboard' | 'users';

const MAX_LOGS = 200;
const ADMIN_USER_ID = 'admin-001'; // Hard-coded admin ID for self-ban prevention (Fitur 6 spec)

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');

  /* ═══ Live Logs Terminal State (UI 05 spec) ═══ */
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  /* ═══ User Management State (UI 05 / Fitur 6 spec) ═══ */
  const [users, setUsers] = useState<UserRow[]>([
    { id: 'u1', name: 'Budi Santoso', wa: '6281234567890', role: 'farmer', isPremium: true, statusActive: true, joinedDate: '2026-01-15', banState: 'active' },
    { id: 'u2', name: 'Sri Wahyuni', wa: '6289876543210', role: 'farmer', isPremium: false, statusActive: true, joinedDate: '2026-03-22', banState: 'active' },
    { id: 'u3', name: 'Ahmad Fauzi', wa: '6285551234567', role: 'distributor', isPremium: true, statusActive: true, joinedDate: '2026-05-10', banState: 'active' },
    { id: 'u4', name: 'Dewi Lestari', wa: '6287771112222', role: 'farmer', isPremium: false, statusActive: true, joinedDate: '2026-06-01', banState: 'active' },
    { id: 'u5', name: 'Sujatmiko', wa: '6281119998877', role: 'farmer', isPremium: true, statusActive: true, joinedDate: '2026-06-18', banState: 'active' },
    { id: ADMIN_USER_ID, name: 'Admin Agrikarta', wa: '6280000000000', role: 'admin', isPremium: true, statusActive: true, joinedDate: '2026-01-01', banState: 'active' },
  ]);

  /* ── Simulate Supabase Realtime log stream (UI 05 / Fitur 6 spec) ── */
  const addLog = useCallback((message: string, source: string) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        message,
        source,
      };
      const updated = [...prev, newLog];
      // Fitur 6 Edge Case 1: Max 200 logs, shift oldest if exceeded
      if (updated.length > MAX_LOGS) {
        return updated.slice(updated.length - MAX_LOGS);
      }
      return updated;
    });
  }, []);

  /* ── Auto-scroll terminal to bottom (UI 05 spec: useRef + useEffect + scrollIntoView) ── */
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  /* ── Simulate real-time log events ── */
  useEffect(() => {
    const bootLogs = [
      { msg: 'System boot: AgriCarta Admin Portal initialized', src: 'SYSTEM' },
      { msg: 'Supabase Realtime: Channel subscribed to postgres_changes', src: 'REALTIME' },
      { msg: 'API Hit: GET /api/health → 200 OK (45ms)', src: 'BACKEND' },
      { msg: 'ML Engine: Health check passed (120ms)', src: 'ML' },
      { msg: 'Bot: WhatsApp connection state: OPEN', src: 'BOT' },
    ];
    bootLogs.forEach((log, i) => {
      setTimeout(() => addLog(log.msg, log.src), 200 * (i + 1));
    });

    // Periodic simulated events
    const interval = setInterval(() => {
      const events = [
        { msg: `API Hit: POST /api/checkout → 200 OK`, src: 'BACKEND' },
        { msg: `Bot: New msg from 62812${Math.floor(Math.random() * 9000000 + 1000000)}`, src: 'BOT' },
        { msg: `Model LSTM: Inference complete for commodity_id=${Math.ceil(Math.random() * 6)}`, src: 'ML' },
        { msg: `API Hit: POST /api/persona-sync → 200 OK`, src: 'BACKEND' },
        { msg: `Realtime: INSERT on harvest_reports (commodity: Cabai, weight: ${Math.floor(Math.random() * 200)}kg)`, src: 'REALTIME' },
        { msg: `API Hit: GET /api/prices/predictions?commodity=jagung → 200 OK`, src: 'ML' },
        { msg: `Bot: Media download complete, uploading to Supabase Storage`, src: 'BOT' },
        { msg: `API Hit: POST /api/midtrans-webhook → Signature verified ✓`, src: 'BACKEND' },
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      addLog(event.msg, event.src);
    }, 3000);

    // Simulate connection flicker for status indicator (Fitur 6 Edge Case 2)
    const connInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        setConnectionStatus('disconnected');
        setTimeout(() => setConnectionStatus('connected'), 5000);
      }
    }, 10000);

    return () => { clearInterval(interval); clearInterval(connInterval); };
  }, [addLog]);

  /* ═══ Ban User Handler (Fitur 6 spec) ═══ */
  /* 1. Click → text "Banning..." with spinner
     2. Simulate Supabase update (status_active = false)
     3. Change to "Banned" (bg-gray-500 cursor-not-allowed shadow-none border-gray-700) */
  const handleBanUser = useCallback((userId: string) => {
    // Fitur 6 Edge Case 3: Prevent self-ban
    if (userId === ADMIN_USER_ID) return;

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, banState: 'banning' as const } : u
    ));

    addLog(`Admin Action: Banning user ${userId}...`, 'ADMIN');

    // Simulate Supabase UPDATE users SET status_active = false
    setTimeout(() => {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, banState: 'banned' as const, statusActive: false } : u
      ));
      addLog(`Admin Action: User ${userId} successfully banned (status_active = false)`, 'ADMIN');
    }, 1500);
  }, [addLog]);

  /* ── Sidebar items (UI 05 spec: Dashboard, Manajemen User, Logout) ── */
  const sidebarItems: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { key: 'users', label: 'Manajemen User', icon: '👥' },
  ];

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'BACKEND': return 'text-yellow-400';
      case 'ML': return 'text-purple-400';
      case 'BOT': return 'text-cyan-400';
      case 'REALTIME': return 'text-blue-400';
      case 'ADMIN': return 'text-red-400';
      default: return 'text-[#00FF00]';
    }
  };

  return (
    /* Admin Layout (UI 05 spec): flex h-screen bg-agri-cream overflow-hidden */
    <div className="flex h-screen bg-agri-cream overflow-hidden">

      {/* ═══ Admin Sidebar (UI 05 spec) ═══ */}
      {/* w-64 bg-agri-dark text-white border-r-4 border-agri-dark flex flex-col p-6 shrink-0 */}
      <aside className="w-64 bg-agri-dark text-white border-r-4 border-agri-dark flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b-4 border-white/10">
          <div className="w-8 h-8 rounded-lg bg-agri-amber border-2 border-agri-dark flex items-center justify-center shadow-brutal-sm">
            <span className="text-agri-dark font-black text-sm">A</span>
          </div>
          <div>
            <h2 className="font-black text-sm tracking-wide">AGRIKARTA</h2>
            <p className="text-xs text-white/50 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Sidebar Links (UI 05 spec: font-bold block py-3 px-4 rounded-lg hover:bg-white/10 transition-colors) */}
        <nav className="flex-1 p-6 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left font-bold block py-3 px-4 rounded-lg transition-colors flex items-center gap-3 ${
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

        {/* Connection Status Indicator (Fitur 6 Edge Case 2) */}
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-500 animate-pulse'}`} />
            <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus === 'connected' ? 'Realtime Connected' : 'Disconnected — Reconnecting...'}
            </span>
          </div>
        </div>

        <div className="p-6 border-t-4 border-white/10">
          <button
            onClick={onBack}
            className="w-full text-left font-bold block py-3 px-4 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3"
          >
            <span>←</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ═══ Main Content Area (UI 05 spec): flex-1 h-full overflow-y-auto p-8 ═══ */}
      <main className="flex-1 h-full overflow-y-auto p-8">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h1 className="text-3xl font-black tracking-tight text-agri-dark">Admin Dashboard</h1>

            {/* ═══ Live Logs Terminal (UI 05 spec) ═══ */}
            {/* Container: bg-black font-mono h-64 overflow-y-auto p-4 border-4 border-agri-dark rounded-xl shadow-brutal-base mb-8 */}
            {/* Text: text-[#00FF00] text-sm leading-relaxed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-xl text-agri-dark">Live System Logs</h2>
                <span className="text-xs font-bold text-agri-dark/60">{logs.length} / {MAX_LOGS} entries</span>
              </div>
              <div
                ref={terminalRef}
                className="bg-black font-mono h-64 overflow-y-auto p-4 border-4 border-agri-dark rounded-xl shadow-brutal-base"
              >
                {logs.length === 0 ? (
                  <p className="text-[#00FF00] text-sm animate-pulse">Waiting for real-time events...</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="text-sm leading-relaxed flex">
                      <span className="text-gray-500 mr-2 shrink-0">[{log.timestamp}]</span>
                      <span className={`mr-2 shrink-0 font-bold ${getSourceColor(log.source)}`}>[{log.source}]</span>
                      <span className="text-[#00FF00]">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ═══ User Management Table (Quick View in Dashboard) ═══ */}
            <div className="space-y-2">
              <h2 className="font-black text-xl text-agri-dark">Manajemen User</h2>
              {/* Table Wrapper (UI 05 spec): bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden */}
              <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
                <table className="w-full">
                  <thead>
                    {/* Header (UI 05 spec): bg-gray-100 border-b-4 border-agri-dark font-black text-left p-4 */}
                    <tr className="bg-gray-100 border-b-4 border-agri-dark font-black text-left text-sm">
                      <th className="p-4">WhatsApp</th>
                      <th className="p-4">Nama</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      /* Row (UI 05 spec): border-b-2 border-agri-dark p-4 */
                      <tr key={u.id} className="border-b-2 border-agri-dark hover:bg-agri-cream/20 transition-colors">
                        <td className="p-4 font-mono text-sm text-agri-dark/80">{u.wa}</td>
                        <td className="p-4 font-bold text-agri-dark">{u.name}</td>
                        <td className="p-4 text-sm font-bold text-agri-dark/70 uppercase">{u.role}</td>
                        <td className="p-4 text-center">
                          {u.isPremium ? (
                            <span className="bg-agri-amber text-agri-dark font-black px-3 py-1 rounded-md border-2 border-agri-dark text-xs">⭐ PREMIUM</span>
                          ) : (
                            <span className="bg-white text-agri-dark/70 font-bold px-3 py-1 rounded-md border-2 border-agri-dark text-xs">FREE</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {/* Ban User Button (UI 05 spec):
                              Active: bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] active:translate-y-0 active:shadow-none transition-all
                              Banned: bg-gray-500 cursor-not-allowed shadow-none border-gray-700 */}
                          {u.id === ADMIN_USER_ID ? (
                            /* Fitur 6 Edge Case 3: Self-ban disabled */
                            <button
                              disabled
                              className="bg-gray-300 text-gray-500 font-black px-4 py-2 rounded-lg border-2 border-gray-400 text-xs cursor-not-allowed"
                            >
                              (You)
                            </button>
                          ) : u.banState === 'banned' ? (
                            <button
                              disabled
                              className="bg-gray-500 text-white font-black px-4 py-2 rounded-lg border-2 border-gray-700 cursor-not-allowed shadow-none text-xs"
                            >
                              Banned
                            </button>
                          ) : u.banState === 'banning' ? (
                            <button
                              disabled
                              className="bg-red-400 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark text-xs cursor-wait flex items-center gap-2 ml-auto"
                            >
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Banning...
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(u.id)}
                              className="bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] active:translate-y-0 active:shadow-none transition-all text-xs"
                            >
                              BAN USER
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab (expanded view) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black tracking-tight text-agri-dark">Manajemen User (Detail)</h1>
            <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-4 border-agri-dark font-black text-left text-sm">
                    <th className="p-4">WhatsApp</th>
                    <th className="p-4">Nama</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Premium</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Joined</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b-2 border-agri-dark hover:bg-agri-cream/20 transition-colors">
                      <td className="p-4 font-mono text-sm text-agri-dark/80">{u.wa}</td>
                      <td className="p-4 font-bold text-agri-dark">{u.name}</td>
                      <td className="p-4 text-sm font-bold text-agri-dark/70 uppercase">{u.role}</td>
                      <td className="p-4 text-center">
                        {u.isPremium ? (
                          <span className="bg-agri-amber text-agri-dark font-black px-2 py-1 rounded-md border-2 border-agri-dark text-xs">⭐</span>
                        ) : (
                          <span className="text-agri-dark/40 text-xs font-bold">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-black text-xs px-3 py-1 rounded-md border-2 ${
                          u.statusActive
                            ? 'bg-agri-forest text-white border-agri-dark'
                            : 'bg-red-100 text-red-600 border-red-300'
                        }`}>
                          {u.statusActive ? 'ACTIVE' : 'BANNED'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-agri-dark/60 text-sm">{u.joinedDate}</td>
                      <td className="p-4 text-right">
                        {u.id === ADMIN_USER_ID ? (
                          <button disabled className="bg-gray-300 text-gray-500 font-black px-4 py-2 rounded-lg border-2 border-gray-400 text-xs cursor-not-allowed">(You)</button>
                        ) : u.banState === 'banned' ? (
                          <button disabled className="bg-gray-500 text-white font-black px-4 py-2 rounded-lg border-2 border-gray-700 cursor-not-allowed shadow-none text-xs">Banned</button>
                        ) : u.banState === 'banning' ? (
                          <button disabled className="bg-red-400 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark text-xs cursor-wait flex items-center gap-2 ml-auto">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Banning...
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(u.id)}
                            className="bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000] active:translate-y-0 active:shadow-none transition-all text-xs"
                          >
                            BAN USER
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
