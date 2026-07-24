import React, { useState } from 'react';
import { ShieldAlert, UserX, Activity, CheckCircle2, Search, Terminal } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  role: 'Petani' | 'Distributor' | 'Premium';
  status: 'Active' | 'Banned';
  lastActive: string;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'usr-1', name: 'Budi Santoso', role: 'Petani', status: 'Active', lastActive: '2 menit lalu' },
    { id: 'usr-2', name: 'PT Agrilogistik Jaya', role: 'Distributor', status: 'Active', lastActive: '10 menit lalu' },
    { id: 'usr-3', name: 'AgroCorp Global', role: 'Premium', status: 'Active', lastActive: '1 jam lalu' },
    { id: 'usr-4', name: 'Sujatmiko', role: 'Petani', status: 'Active', lastActive: '3 jam lalu' },
  ]);

  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM 18:35:10] FastAPI ML Engine Model PyTorch LSTM Inference successfully executed.",
    "[AUTH 18:32:04] User 'Budi Santoso' logged in via Magic Link.",
    "[CRON 18:00:00] Daily SP2KP Web Scraper executed. Data ingested successfully.",
    "[SECURITY 17:45:12] CORS check origin 'http://localhost:5173' passed."
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleBanUser = (userId: string, userName: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Banned' ? 'Active' : 'Banned' } : u));
    const isBanning = users.find(u => u.id === userId)?.status === 'Active';
    const actionMsg = isBanning ? `User '${userName}' telah di-BAN dari sistem.` : `User '${userName}' di-UNBAN.`;
    
    setToast(actionMsg);
    setLogs(prev => [`[ADMIN ACTION] ${actionMsg}`, ...prev]);

    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-4 py-3 rounded-xl shadow-2xl font-semibold animate-pulse flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border-rose-500/20">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>UI 05 - Hidden Admin Portal Agrikarta</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Monitoring Sistem & Manajemen Pengguna</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pusat kendali log real-time, audit keamanan, dan manajemen akses pengguna platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Access Management Table */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white flex items-center space-x-2">
              <UserX className="w-5 h-5 text-rose-400" />
              <span>Manajemen Akses & Ban User</span>
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium">
              {users.length} Users Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 font-medium text-white">{user.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px]">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.status === 'Active' ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 inline" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center space-x-1">
                          <ShieldAlert className="w-3 h-3 inline" />
                          <span>Banned</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleBanUser(user.id, user.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          user.status === 'Active'
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {user.status === 'Active' ? 'Ban User' : 'Unban User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time System Logs Terminal */}
        <div className="glass-card p-5 rounded-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="font-bold flex items-center space-x-2 text-white">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Audit System Logs</span>
            </span>
            <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="h-[240px] bg-slate-950 p-3 rounded-xl overflow-y-auto space-y-2 text-slate-300 border border-slate-900">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed border-b border-slate-900/40 pb-1">
                <span className="text-slate-500">&gt;</span> {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
