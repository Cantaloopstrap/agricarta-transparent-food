import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, Star, MapPin } from "lucide-react";
import { GlobalNavbar } from "@/components/GlobalNavbar";

export const Route = createFileRoute("/distributor")({
  head: () => ({
    meta: [
      { title: "Dashboard Distributor — Agrikarta" },
      {
        name: "description",
        content:
          "Nilai kualitas, disiplin, sikap, dan kejujuran distributor pangan di jaringan Agrikarta.",
      },
      { property: "og:title", content: "Dashboard Distributor — Agrikarta" },
      {
        property: "og:description",
        content: "Persona distributor berbasis data untuk transparansi rantai pasok pangan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardDistributor,
});

type Persona = {
  kualitas: number;
  disiplin: number;
  sikap: number;
  kejujuran: number;
};

type Distributor = {
  id: string;
  name: string;
  region: string;
  rating: number; // 0-5
  persona: Persona;
};

const DISTRIBUTORS: Distributor[] = [
  {
    id: "1",
    name: "UD. Makmur Tani",
    region: "Brebes, Jawa Tengah",
    rating: 4.8,
    persona: { kualitas: 75, disiplin: 90, sikap: 85, kejujuran: 95 },
  },
  {
    id: "2",
    name: "PT. Agro Sejahtera",
    region: "Malang, Jawa Timur",
    rating: 3.9,
    persona: { kualitas: 80, disiplin: 70, sikap: 78, kejujuran: 82 },
  },
  {
    id: "3",
    name: "CV. Panen Raya",
    region: "Bandung, Jawa Barat",
    rating: 4.5,
    persona: { kualitas: 88, disiplin: 82, sikap: 90, kejujuran: 87 },
  },
  {
    id: "4",
    name: "UD. Hasil Bumi",
    region: "Nganjuk, Jawa Timur",
    rating: 4.2,
    persona: { kualitas: 70, disiplin: 85, sikap: 75, kejujuran: 88 },
  },
];

function DashboardDistributor() {
  const [selected, setSelected] = useState<Distributor | null>(null);

  return (
    <div className="min-h-screen bg-agri-cream">
      <GlobalNavbar />

      <header className="pt-28 pb-6 px-6 max-w-7xl mx-auto">
        <div className="inline-block bg-agri-forest text-white font-black px-3 py-1 border-4 border-agri-dark rounded-lg shadow-brutal-sm mb-4 uppercase tracking-tight text-xs">
          Dashboard Distributor
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-agri-dark tracking-tight leading-tight">
          Persona Distributor
        </h1>
        <p className="mt-3 font-bold text-agri-dark/80 max-w-2xl">
          Klik salah satu kartu untuk melihat persona lengkap, dihitung dari webhook Google Form.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-6 pb-16 max-w-7xl mx-auto">
        {DISTRIBUTORS.map((d) => (
          <DistributorCard key={d.id} distributor={d} onClick={() => setSelected(d)} />
        ))}
      </section>

      {selected && <PersonaModal distributor={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DistributorCard({
  distributor,
  onClick,
}: {
  distributor: Distributor;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-agri-cream border-4 border-agri-dark rounded-xl p-6 shadow-brutal-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 active:shadow-brutal-sm"
    >
      <h3 className="text-2xl font-black text-agri-dark tracking-tight mb-2">
        {distributor.name}
      </h3>
      <div className="flex items-center gap-2 mb-4 font-bold text-agri-dark/70 text-sm">
        <MapPin className="w-4 h-4" strokeWidth={3} />
        {distributor.region}
      </div>
      <div className="flex items-center gap-3">
        <StarRating value={distributor.rating} />
        <span className="font-black text-agri-dark text-lg">{distributor.rating.toFixed(1)}</span>
      </div>
      <p className="mt-4 inline-block bg-agri-amber text-agri-dark font-black text-xs px-3 py-1 border-2 border-agri-dark rounded-md uppercase tracking-tight">
        Klik untuk Persona →
      </p>
    </button>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-1" aria-label={`Rating ${value} dari 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            className={filled ? "fill-agri-amber stroke-agri-dark" : "fill-white stroke-agri-dark"}
            strokeWidth={2.5}
            size={22}
          />
        );
      })}
    </div>
  );
}

function PersonaModal({
  distributor,
  onClose,
}: {
  distributor: Distributor;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-agri-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white border-4 border-agri-dark shadow-brutal-modal p-6 md:p-8 max-w-md w-full rounded-xl animate-scale-in"
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute -top-4 -right-4 w-11 h-11 bg-red-500 text-white border-4 border-agri-dark rounded-lg shadow-brutal-sm flex items-center justify-center font-black transition-transform duration-200 hover:-translate-y-0.5"
        >
          <X className="w-5 h-5" strokeWidth={4} />
        </button>

        <div className="inline-block bg-agri-forest text-white font-black px-3 py-1 border-2 border-agri-dark rounded-md uppercase text-xs tracking-tight mb-2">
          Persona
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-agri-dark tracking-tight leading-tight">
          {distributor.name}
        </h2>
        <div className="flex items-center gap-2 mt-2 mb-6">
          <StarRating value={distributor.rating} />
          <span className="font-black text-agri-dark">{distributor.rating.toFixed(1)}</span>
        </div>

        <div className="space-y-4">
          <ProgressBar label="Kualitas" value={distributor.persona.kualitas} />
          <ProgressBar label="Disiplin" value={distributor.persona.disiplin} />
          <ProgressBar label="Sikap" value={distributor.persona.sikap} />
          <ProgressBar label="Kejujuran" value={distributor.persona.kejujuran} />
        </div>

        <p className="mt-6 text-xs font-bold text-agri-dark/60 uppercase tracking-tight">
          Sumber: Webhook Google Form Rating
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="font-bold text-agri-dark mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-black">{clamped}%</span>
      </div>
      <div className="bg-white border-2 border-agri-dark h-6 rounded-full w-full overflow-hidden">
        <div
          className="h-full bg-agri-amber border-r-2 border-agri-dark rounded-r-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
