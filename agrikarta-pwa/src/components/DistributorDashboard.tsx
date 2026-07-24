import React, { useState } from 'react';

interface Distributor {
  id: string;
  name: string;
  avgScore: number;
  scores: {
    kualitas: number;
    disiplin: number;
    sikap: number;
    kejujuran: number;
  };
}

/* ── Star Rating SVG Component ── */
const StarRating: React.FC<{ score: number; max?: number }> = ({ score, max = 5 }) => {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className="w-6 h-6" viewBox="0 0 24 24" strokeWidth="2">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            className={i < Math.round(score) ? 'fill-agri-amber stroke-agri-dark' : 'fill-white stroke-agri-dark'}
          />
        </svg>
      ))}
    </div>
  );
};

/* ── Progress Bar Component ── */
const ProgressBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div className="mb-3">
      <div className="font-bold text-agri-dark mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="bg-white border-2 border-agri-dark h-6 rounded-full w-full overflow-hidden">
        <div
          className="bg-agri-amber border-r-2 border-agri-dark h-full transition-all duration-700 ease-out rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export const DistributorDashboard: React.FC = () => {
  const [selected, setSelected] = useState<Distributor | null>(null);

  const [distributors] = useState<Distributor[]>([
    { id: 'd1', name: 'UD. Makmur Tani', avgScore: 4.8, scores: { kualitas: 75, disiplin: 90, sikap: 85, kejujuran: 95 } },
    { id: 'd2', name: 'PT. Agro Sejahtera', avgScore: 3.9, scores: { kualitas: 60, disiplin: 70, sikap: 80, kejujuran: 65 } },
    { id: 'd3', name: 'CV. Tani Subur Jaya', avgScore: 4.5, scores: { kualitas: 88, disiplin: 82, sikap: 90, kejujuran: 92 } },
    { id: 'd4', name: 'PT. Pangan Nusantara', avgScore: 4.2, scores: { kualitas: 78, disiplin: 85, sikap: 72, kejujuran: 88 } },
    { id: 'd5', name: 'UD. Berkah Tani', avgScore: 3.5, scores: { kualitas: 55, disiplin: 65, sikap: 60, kejujuran: 70 } },
    { id: 'd6', name: 'CV. Agrilogistik Prima', avgScore: 4.7, scores: { kualitas: 92, disiplin: 88, sikap: 95, kejujuran: 90 } },
  ]);

  return (
    <>
      {/* ═══ Distributor Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 pb-12 max-w-7xl mx-auto mt-28">
        <div className="col-span-full mb-2">
          <h1 className="text-3xl font-black text-agri-dark tracking-tight">Daftar Distributor & Pengepul</h1>
          <p className="text-agri-dark/60 font-medium mt-1">Klik kartu untuk melihat detail persona penilaian dari Google Form.</p>
        </div>

        {distributors.map((dist) => (
          <div
            key={dist.id}
            onClick={() => setSelected(dist)}
            className="bg-agri-cream border-4 border-agri-dark rounded-xl p-6 shadow-brutal-card cursor-pointer hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 active:shadow-brutal-sm transition-all"
          >
            <h3 className="text-2xl font-black text-agri-dark mb-2">{dist.name}</h3>
            <div className="flex items-center gap-3">
              <StarRating score={dist.avgScore} />
              <span className="font-black text-agri-dark text-lg">{dist.avgScore}</span>
            </div>
            <p className="text-sm text-agri-dark/60 font-bold mt-3">Klik untuk Persona →</p>
          </div>
        ))}
      </div>

      {/* ═══ Persona Modal (Overlay) ═══ */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] bg-agri-dark/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white border-4 border-agri-dark shadow-[12px_12px_0_0_#FFBF00] p-8 max-w-md w-full rounded-xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 bg-red-500 text-white font-black border-2 border-agri-dark px-3 py-1 rounded hover:bg-red-600 shadow-brutal-sm transition-all"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-agri-dark mb-1">Persona: {selected.name}</h3>
            <div className="flex items-center gap-2 mb-6">
              <StarRating score={selected.avgScore} />
              <span className="font-black text-agri-dark">{selected.avgScore}/5.0</span>
            </div>

            <div className="border-t-2 border-agri-dark pt-4">
              <ProgressBar label="Kualitas Produk" value={selected.scores.kualitas} />
              <ProgressBar label="Disiplin Pengiriman" value={selected.scores.disiplin} />
              <ProgressBar label="Sikap & Pelayanan" value={selected.scores.sikap} />
              <ProgressBar label="Kejujuran & Integritas" value={selected.scores.kejujuran} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
