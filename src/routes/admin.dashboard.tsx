import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Users, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Agrikarta" },
      { name: "description", content: "Hidden admin portal for monitoring live system logs and managing users." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Portal — Agrikarta" },
      { property: "og:description", content: "Internal admin dashboard." },
    ],
  }),
  component: AdminDashboard,
});

const INITIAL_LOGS = [
  "> [INFO] System boot complete.",
  "> [API] Hit: /webhook/midtrans — 200 OK",
  "> [BOT] New msg from 62812xxxx1234",
  "> [MODEL] LSTM: Retraining batch #421...",
  "> [DB] Supabase channel: connected",
  "> [API] Hit: /api/prices/latest — 200 OK",
];

const SIMULATED_LOGS = [
  "> [API] Hit: /webhook/midtrans — 200 OK",
  "> [BOT] New msg from 62819xxxx5678",
  "> [MODEL] LSTM: Prediction generated (H+7)",
  "> [AUTH] Magic link issued to user@agrikarta.id",
  "> [DB] INSERT into harvests OK (id=8821)",
  "> [ALERT] Price spike detected: Cabai Rawit +8%",
];

type UserRow = { phone: string; name: string; banned: boolean };

const DUMMY_USERS: UserRow[] = [
  { phone: "62812xxxx1234", name: "Budi Santoso", banned: false },
  { phone: "62819xxxx5678", name: "Siti Aminah", banned: false },
  { phone: "62813xxxx9012", name: "Agus Prasetyo", banned: false },
  { phone: "62821xxxx3456", name: "Rina Wijaya", banned: false },
  { phone: "62856xxxx7890", name: "Dedi Kurniawan", banned: false },
];

function LiveLogsTerminal() {
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const next = SIMULATED_LOGS[Math.floor(Math.random() * SIMULATED_LOGS.length)];
      const ts = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `[${ts}] ${next}`]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={containerRef}
      className="bg-black font-mono h-64 overflow-y-auto p-4 border-4 border-agri-dark rounded-xl shadow-brutal-base mb-8"
    >
      {logs.map((line, i) => (
        <div key={i} className="text-[#00FF00] text-sm leading-relaxed">
          {line}
        </div>
      ))}
    </div>
  );
}

function UserManagementTable() {
  const [users, setUsers] = useState<UserRow[]>(DUMMY_USERS);

  const banUser = (phone: string) => {
    setUsers((prev) => prev.map((u) => (u.phone === phone ? { ...u, banned: true } : u)));
  };

  return (
    <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b-4 border-agri-dark">
            <th className="font-black text-left p-4 text-agri-dark">Phone</th>
            <th className="font-black text-left p-4 text-agri-dark">Name</th>
            <th className="font-black text-left p-4 text-agri-dark">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.phone} className="border-b-2 border-agri-dark last:border-b-0">
              <td className="p-4 font-mono font-bold text-agri-dark">{u.phone}</td>
              <td className="p-4 font-bold text-agri-dark">{u.name}</td>
              <td className="p-4">
                {u.banned ? (
                  <button
                    disabled
                    className="bg-gray-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-none cursor-not-allowed"
                  >
                    Banned
                  </button>
                ) : (
                  <button
                    onClick={() => banUser(u.phone)}
                    className="bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
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
  );
}

function AdminDashboard() {
  return (
    <div className="flex h-screen bg-agri-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-agri-dark text-white border-r-4 border-agri-dark flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-2 mb-10">
          <Shield className="w-7 h-7 text-agri-amber" />
          <span className="font-black text-xl tracking-tight">ADMIN</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <a href="#" className="font-bold block py-3 px-4 rounded-lg bg-white/10 flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="font-bold block py-3 px-4 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3">
            <Users className="w-5 h-5" /> Manajemen User
          </a>
        </nav>
        <a href="#" className="font-bold block py-3 px-4 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3">
          <LogOut className="w-5 h-5" /> Logout
        </a>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black text-agri-dark tracking-tight">Admin Dashboard</h1>
          <p className="font-bold text-agri-dark/70 mt-1">Real-time system monitoring & user management.</p>
        </div>

        <h2 className="text-xl font-black text-agri-dark mb-3 uppercase tracking-tight">Live Logs Terminal</h2>
        <LiveLogsTerminal />

        <h2 className="text-xl font-black text-agri-dark mb-3 uppercase tracking-tight">Manajemen User</h2>
        <UserManagementTable />
      </main>
    </div>
  );
}
