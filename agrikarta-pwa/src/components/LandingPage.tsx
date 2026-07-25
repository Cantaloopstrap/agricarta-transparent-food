import React, { useState, useEffect } from 'react';

interface PriceRow {
  name: string;
  price: number;
  change: number; // percentage
}

interface LandingPageProps {
  onNavigate: (tab: 'premium' | 'petani' | 'distributor' | 'admin' | 'landing') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [showModal, setShowModal] = useState(false);
  const [waNumber, setWaNumber] = useState('');
  const [loading, setLoading] = useState(true);

  const [prices] = useState<PriceRow[]>([
    { name: 'Beras Medium', price: 14500, change: 1.2 },
    { name: 'Cabai Merah Keriting', price: 38000, change: -2.5 },
    { name: 'Bawang Merah', price: 32000, change: 3.1 },
    { name: 'Jagung Pipilan', price: 5200, change: 0.8 },
    { name: 'Minyak Goreng', price: 17500, change: -0.4 },
    { name: 'Padi Gabah Kering', price: 6800, change: 1.5 },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handlePaywallSubmit = () => {
    if (waNumber.length >= 10) {
      alert(`Magic Link akan dikirim ke ${waNumber} via WhatsApp Bot.`);
      setShowModal(false);
      setWaNumber('');
    }
  };

  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <section className="pt-28 pb-12 px-6 text-center max-w-7xl mx-auto flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-black text-agri-dark tracking-tight leading-tight">
          Harga Pangan Transparan<br />& Akurat
        </h1>
        <p className="mt-4 text-lg md:text-xl text-agri-dark/70 font-medium max-w-2xl">
          Platform infrastruktur data pangan berbasis AI untuk petani, distributor, dan konsumen Indonesia.
          Didukung oleh <span className="font-black text-agri-forest">LSTM Deep Learning</span> dan laporan panen via <span className="font-black text-agri-forest">WhatsApp Bot</span>.
        </p>
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <button
            onClick={() => onNavigate('premium')}
            className="bg-agri-amber text-agri-dark font-black px-8 py-3 rounded-xl border-4 border-agri-dark shadow-brutal-base hover:-translate-y-1 hover:shadow-brutal-hover transition-all text-lg"
          >
            Lihat Prediksi Harga →
          </button>
          <button
            onClick={() => onNavigate('petani')}
            className="bg-white text-agri-dark font-black px-8 py-3 rounded-xl border-4 border-agri-dark shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal-base transition-all text-lg"
          >
            Dashboard Petani
          </button>
        </div>
      </section>

      {/* ═══ Public Price Table ═══ */}
      <section className="mx-6 lg:mx-auto max-w-4xl mb-12">
        <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
          {/* Table Header */}
          <div className="bg-agri-cream border-b-4 border-agri-dark px-6 py-4 flex items-center justify-between">
            <h2 className="font-black text-agri-dark text-xl">📊 Harga Pangan Hari Ini</h2>
            <span className="text-xs font-bold text-agri-dark/60 bg-white px-3 py-1 rounded-lg border-2 border-agri-dark">
              Sumber: SP2KP Kemendag
            </span>
          </div>

          {/* Table Body */}
          <table className="w-full">
            <thead>
              <tr className="bg-agri-cream/50 border-b-2 border-agri-dark text-left text-sm font-black text-agri-dark">
                <th className="px-6 py-3">Komoditas</th>
                <th className="px-6 py-3 text-right">Harga/kg</th>
                <th className="px-6 py-3 text-right">Tren</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b-2 border-agri-dark">
                    <td className="px-6 py-4"><div className="h-5 w-40 bg-agri-cream animate-pulse rounded" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-5 w-24 bg-agri-cream animate-pulse rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-5 w-16 bg-agri-cream animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                prices.map((item, idx) => (
                  <tr key={idx} className="border-b-2 border-agri-dark hover:bg-agri-cream/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-agri-dark">{item.name}</td>
                    <td className="px-6 py-4 text-right font-black text-agri-dark">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.change >= 0 ? (
                        <span className="text-red-600 font-bold">▲ +{item.change}%</span>
                      ) : (
                        <span className="text-agri-forest font-bold">▼ {item.change}%</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Paywall / Premium Teaser ═══ */}
      <section className="mx-6 lg:mx-auto max-w-5xl mb-16">
        <div className="relative h-80 flex items-center justify-center bg-white border-4 border-agri-dark rounded-xl overflow-hidden">
          {/* Diagonal Stripe Pattern Overlay */}
          <div className="absolute inset-0 bg-diagonal-stripes pointer-events-none" />

          {/* Inner CTA Box */}
          <div className="bg-agri-amber border-4 border-agri-dark p-8 md:p-12 rounded-xl z-10 shadow-brutal-base flex flex-col items-center text-center">
            <h3 className="text-2xl md:text-3xl font-black text-agri-dark tracking-tight mb-3">
              Akses Prediksi Harga H+7!
            </h3>
            <p className="text-agri-dark/80 font-bold text-sm md:text-base mb-6 max-w-sm">
              Gunakan kecerdasan buatan PyTorch LSTM untuk memprediksi harga 7 hari ke depan dengan Confidence Interval 95%.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-agri-dark text-white font-black px-8 py-3 rounded-xl border-4 border-agri-dark shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all text-lg"
            >
              Gabung Premium 🚀
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Gatekeeper Modal (Paywall) ═══ */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-agri-dark/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white border-4 border-agri-dark shadow-brutal-modal p-8 max-w-md w-full rounded-xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-red-500 text-white font-black border-2 border-agri-dark px-3 py-1 rounded hover:bg-red-600 shadow-brutal-sm transition-all"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black text-agri-dark mb-2">Daftar Premium</h3>
            <p className="text-agri-dark/70 font-medium text-sm mb-6">
              Masukkan nomor WhatsApp Anda. Magic Link akan dikirimkan oleh bot untuk mengaktifkan akses premium.
            </p>

            <label className="block font-black text-agri-dark text-sm mb-2">Nomor WhatsApp</label>
            <input
              type="tel"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="628xxxxxxxxxx"
              className="w-full border-4 border-agri-dark bg-agri-cream rounded-xl px-4 py-3 font-bold text-agri-dark outline-none focus:ring-4 focus:ring-agri-amber transition-shadow mb-4"
            />

            <button
              onClick={handlePaywallSubmit}
              disabled={waNumber.length < 10}
              className="w-full bg-agri-amber text-agri-dark font-black py-3 rounded-xl border-4 border-agri-dark shadow-brutal-base hover:-translate-y-1 hover:shadow-brutal-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brutal-base"
            >
              Kirim Magic Link via WhatsApp
            </button>
          </div>
        </div>
      )}
    </>
  );
};
