import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShieldCheck, ChevronDown, Zap } from "lucide-react";
import { GlobalNavbar } from "@/components/GlobalNavbar";

export const Route = createFileRoute("/petani")({
  head: () => ({
    meta: [
      { title: "Dashboard Petani — Agrikarta" },
      {
        name: "description",
        content:
          "Galeri hasil panen terverifikasi yang dilaporkan petani via WhatsApp Bot Agrikarta.",
      },
      { property: "og:title", content: "Dashboard Petani — Agrikarta" },
      {
        property: "og:description",
        content: "Pantau hasil panen terverifikasi dari petani di seluruh Indonesia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPetani,
});

type Harvest = {
  id: string;
  commodity: string;
  weightKg: number;
  farmer: string;
  region: string;
  date: string;
};

const HARVESTS: Harvest[] = [
  { id: "1", commodity: "Cabai Rawit", weightKg: 50, farmer: "Pak Slamet", region: "Brebes", date: "2025-11-18" },
  { id: "2", commodity: "Bawang Merah", weightKg: 20, farmer: "Bu Yuli", region: "Nganjuk", date: "2025-11-18" },
  { id: "3", commodity: "Tomat", weightKg: 100, farmer: "Pak Budi", region: "Malang", date: "2025-11-17" },
  { id: "4", commodity: "Kentang", weightKg: 75, farmer: "Pak Darto", region: "Dieng", date: "2025-11-17" },
  { id: "5", commodity: "Kubis", weightKg: 120, farmer: "Bu Rina", region: "Bandung", date: "2025-11-16" },
  { id: "6", commodity: "Wortel", weightKg: 45, farmer: "Pak Iwan", region: "Cipanas", date: "2025-11-16" },
];

const DATE_FILTERS = [
  { value: "all", label: "Semua Tanggal" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
];

const SIMULATED_COMMODITIES = [
  { commodity: "Cabai Rawit", weightKg: 50, farmer: "Pak Joko", region: "Kediri" },
  { commodity: "Padi", weightKg: 200, farmer: "Bu Ani", region: "Karawang" },
  { commodity: "Jagung", weightKg: 150, farmer: "Pak Herman", region: "Blitar" },
  { commodity: "Bawang Putih", weightKg: 30, farmer: "Bu Sari", region: "Tegal" },
];

function DashboardPetani() {
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [harvests, setHarvests] = useState<Harvest[]>(HARVESTS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return harvests.filter((h) => (q ? h.commodity.toLowerCase().includes(q) : true));
  }, [query, harvests]);

  const simulateWebhook = () => {
    const pick = SIMULATED_COMMODITIES[Math.floor(Math.random() * SIMULATED_COMMODITIES.length)];
    const now = new Date();
    const newHarvest: Harvest = {
      id: `sim-${now.getTime()}`,
      commodity: pick.commodity,
      weightKg: pick.weightKg,
      farmer: pick.farmer,
      region: pick.region,
      date: now.toISOString().slice(0, 10),
    };
    setHarvests((prev) => [newHarvest, ...prev]);
  };


  return (
    <div className="min-h-screen bg-agri-cream">
      <GlobalNavbar />

      <header className="pt-28 pb-6 px-6 max-w-7xl mx-auto">
        <div className="inline-block bg-agri-forest text-white font-black px-3 py-1 border-4 border-agri-dark rounded-lg shadow-brutal-sm mb-4 uppercase tracking-tight text-xs">
          Dashboard Petani
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-agri-dark tracking-tight leading-tight">
          Galeri Panen Terverifikasi
        </h1>
        <p className="mt-3 font-bold text-agri-dark/80 max-w-2xl">
          Laporan panen yang berhasil di-ingest melalui WhatsApp Bot Agrikarta.
        </p>
      </header>

      {/* Filter Bar */}
      <div className="bg-agri-cream p-4 rounded-xl border-4 border-agri-dark shadow-brutal-sm mb-8 mx-6 lg:mx-auto max-w-7xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agri-dark"
            strokeWidth={3}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Komoditas..."
            className="w-full border-4 border-agri-dark bg-white rounded-lg pl-11 pr-4 py-2 font-bold text-agri-dark placeholder:text-agri-dark/50 outline-none focus:ring-4 focus:ring-agri-amber transition-shadow"
          />
        </div>
        <div className="relative sm:w-64">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none w-full border-4 border-agri-dark bg-white rounded-lg px-4 py-2 pr-10 font-bold text-agri-dark outline-none focus:ring-4 focus:ring-agri-amber transition-shadow cursor-pointer"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agri-dark pointer-events-none"
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Harvest Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 pb-16 max-w-7xl mx-auto">
        {filtered.map((h) => (
          <HarvestCard key={h.id} harvest={h} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full bg-white border-4 border-agri-dark rounded-xl p-8 text-center font-black text-agri-dark shadow-brutal-card">
            Tidak ada panen yang cocok dengan pencarian.
          </div>
        )}
      </section>

      {/* Floating Simulate Bot Webhook button */}
      <button
        onClick={simulateWebhook}
        className="fixed bottom-6 right-6 z-40 bg-agri-amber text-agri-dark font-black px-5 py-4 border-4 border-agri-dark rounded-xl shadow-brutal-base transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-hover flex items-center gap-2 uppercase tracking-tight"
      >
        <Zap className="w-5 h-5" strokeWidth={3} />
        Simulate Bot Webhook
      </button>
    </div>
  );
}

function HarvestCard({ harvest }: { harvest: Harvest }) {
  return (
    <article className="relative bg-white p-5 border-4 border-agri-dark rounded-xl shadow-brutal-card cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-hover flex flex-col">
      <div className="absolute top-7 right-7 z-10 inline-flex items-center gap-1 bg-agri-forest text-white text-xs font-black px-2 py-1 rounded-md border-2 border-agri-dark shadow-brutal-sm uppercase tracking-tight">
        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={3} />
        Verified
      </div>

      <div className="aspect-square bg-gray-200 border-2 border-agri-dark rounded-lg mb-4 overflow-hidden flex items-center justify-center">
        <span className="text-6xl font-black text-agri-dark/30 tracking-tight">
          {harvest.commodity.charAt(0)}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-black text-xl text-agri-dark tracking-tight">
          {harvest.commodity} - {harvest.weightKg}kg
        </h3>
        <p className="mt-1 font-bold text-agri-dark/70 text-sm">
          {harvest.farmer} • {harvest.region}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t-4 border-agri-dark/10 flex items-center justify-between">
        <span className="font-bold text-xs text-agri-dark/60 uppercase tracking-tight">
          {new Date(harvest.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="font-black text-xs text-agri-forest uppercase tracking-tight">
          WA Bot
        </span>
      </div>
    </article>
  );
}
