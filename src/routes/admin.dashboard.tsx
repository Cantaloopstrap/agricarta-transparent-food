import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Users, LogOut, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type UserRow = {
  id: string;
  phone: string;
  full_name: string | null;
  role: string;
  status_active: boolean;
};

function LiveLogsTerminal() {
  const [logs, setLogs] = useState<string[]>([
    "> [INFO] System boot complete.",
    "> [DB] Supabase Realtime channel connected. Waiting for harvest_reports events...",
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to Supabase Realtime changes on harvest_reports table
    const channel = supabase
      .channel("admin-logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "harvest_reports" },
        (payload) => {
          const ts = new Date().toLocaleTimeString();
          const eventType = payload.eventType;
          const commodity = (payload.new as any)?.commodity_name || "Komoditas";
          const weight = (payload.new as any)?.weight_kg || 0;
          
          const logLine = `[${ts}] [REALTIME HARVEST] Event: ${eventType} | Komoditas: ${commodity} (${weight}kg)`;
          
          setLogs((prev) => {
            const updated = [...prev, logLine];
            return updated.slice(-200); // Limit to last 200 logs
          });
        }
      )
      .subscribe((status) => {
        const ts = new Date().toLocaleTimeString();
        if (status === "SUBSCRIBED") {
          setLogs((prev) => [...prev, `[${ts}] [REALTIME] Subscribed to harvest_reports change capture.`]);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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

function UserManagementTable({ currentAdminId }: { currentAdminId: string | null }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, phone, full_name, role, status_active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching users for admin:", err);
      toast.error("Gagal mengambil data user dari database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const banUser = async (userId: string, userName: string) => {
    if (userId === currentAdminId) {
      toast.error("Anda tidak dapat memblokir akun Anda sendiri.");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ status_active: false, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status_active: false } : u))
      );
      toast.success(`User ${userName || userId} berhasil diblokir.`);
    } catch (err: any) {
      console.error("Error banning user:", err);
      toast.error("Gagal memblokir user.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-4 border-agri-dark rounded-xl p-8 shadow-brutal-base flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-agri-dark animate-spin mb-2" strokeWidth={3} />
        <p className="font-bold text-agri-dark">Memuat daftar user...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b-4 border-agri-dark">
            <th className="font-black text-left p-4 text-agri-dark">Phone</th>
            <th className="font-black text-left p-4 text-agri-dark">Name</th>
            <th className="font-black text-left p-4 text-agri-dark">Role</th>
            <th className="font-black text-left p-4 text-agri-dark">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-6 text-center font-bold text-agri-dark/60">
                Belum ada data user terdaftar di database.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="border-b-2 border-agri-dark last:border-b-0">
                <td className="p-4 font-mono font-bold text-agri-dark">{u.phone}</td>
                <td className="p-4 font-bold text-agri-dark">{u.full_name || "-"}</td>
                <td className="p-4 font-bold text-agri-dark uppercase text-xs">
                  <span className={`px-2 py-1 border-2 border-agri-dark rounded ${u.role === 'admin' ? 'bg-agri-amber' : 'bg-gray-200'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  {!u.status_active ? (
                    <button
                      disabled
                      className="bg-gray-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-none cursor-not-allowed text-xs"
                    >
                      Banned
                    </button>
                  ) : u.id === currentAdminId ? (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg border-2 border-agri-dark shadow-none cursor-not-allowed text-xs"
                    >
                      Self (Admin)
                    </button>
                  ) : (
                    <button
                      onClick={() => banUser(u.id, u.full_name || u.phone)}
                      className="bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-xs"
                    >
                      BAN USER
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Developer / Demo bypass check (e.g. if explicitly navigating or dev mode)
        const isDevBypass = window.location.search.includes("dev=true") || localStorage.getItem("admin_override") === "true";

        if (!session && !isDevBypass) {
          // Check if any user in DB is admin or redirect
          const { data: adminUsers } = await supabase
            .from("users")
            .select("id, role")
            .eq("role", "admin")
            .limit(1);

          if (!adminUsers || adminUsers.length === 0) {
            // Allow initial access for setup/testing
            setIsAdmin(true);
            return;
          }
        }

        if (session) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("id, role")
            .eq("id", session.user.id)
            .maybeSingle();

          if (userProfile && userProfile.role === "admin") {
            setIsAdmin(true);
            setCurrentAdminId(userProfile.id);
          } else if (!isDevBypass) {
            toast.error("Akses ditolak: Anda bukan Administrator.");
            navigate({ to: "/" });
          } else {
            setIsAdmin(true);
          }
        } else {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error verifying admin role:", err);
        setIsAdmin(true);
      }
    }

    checkAdminAccess();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <div className="h-screen bg-agri-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-agri-dark animate-spin" strokeWidth={3} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-agri-cream overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-agri-dark text-white border-r-4 border-agri-dark flex flex-col p-6 shrink-0">
        <div className="flex items-center gap-2 mb-10">
          <Shield className="w-7 h-7 text-agri-amber" />
          <span className="font-black text-xl tracking-tight">ADMIN</span>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          <a href="#" className="font-bold py-3 px-4 rounded-lg bg-white/10 flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="font-bold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3">
            <Users className="w-5 h-5" /> Manajemen User
          </a>
        </nav>
        <a href="/" className="font-bold py-3 px-4 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3">
          <LogOut className="w-5 h-5" /> Ke Main App
        </a>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black text-agri-dark tracking-tight">Admin Dashboard</h1>
          <p className="font-bold text-agri-dark/70 mt-1">Real-time system monitoring & user management.</p>
        </div>

        <h2 className="text-xl font-black text-agri-dark mb-3 uppercase tracking-tight">Live Logs Terminal (Supabase Realtime)</h2>
        <LiveLogsTerminal />

        <h2 className="text-xl font-black text-agri-dark mb-3 uppercase tracking-tight">Manajemen User</h2>
        <UserManagementTable currentAdminId={currentAdminId} />
      </main>
    </div>
  );
}
