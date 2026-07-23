import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import { GlobalNavbar } from "@/components/GlobalNavbar";
import { PaymentModal } from "@/components/PaymentModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agrikarta — Harga Pangan Transparan & Akurat" },
      {
        name: "description",
        content:
          "Agrikarta menyajikan data harga pangan yang transparan dan akurat, lengkap dengan prediksi harga premium H+7.",
      },
      { property: "og:title", content: "Agrikarta — Harga Pangan Transparan & Akurat" },
      {
        property: "og:description",
        content: "Platform transparansi distribusi pangan Indonesia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const priceData = [
  { name: "Bawang Merah", price: "Rp 30.000", change: "+2%", up: true },
  { name: "Cabai Rawit", price: "Rp 45.000", change: "-1%", up: false },
  { name: "Beras Premium", price: "Rp 15.500", change: "+0.5%", up: true },
  { name: "Minyak Goreng", price: "Rp 18.000", change: "-0.8%", up: false },
];

function Landing() {
  const [payOpen, setPayOpen] = useState(false);
  return (
    <div className="min-h-screen bg-agri-cream">
      <GlobalNavbar />


      {/* Hero */}
      <section className="pt-28 pb-12 px-6 text-center max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="inline-block bg-agri-forest text-white font-black px-4 py-2 border-4 border-agri-dark rounded-xl shadow-brutal-sm mb-6 uppercase tracking-tight text-sm">
          Data SP2KP Real-time
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-agri-dark tracking-tight leading-tight max-w-4xl">
          Harga Pangan Transparan & Akurat
        </h1>
        <p className="mt-6 text-lg md:text-xl font-bold text-agri-dark/80 max-w-2xl">
          Pantau pergerakan harga komoditas pangan harian di seluruh Indonesia. Data resmi,
          dianalisis, dan disajikan tanpa filter.
        </p>
      </section>

      {/* Public Price Table */}
      <section className="px-6 mx-auto max-w-4xl">
        <div className="bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden">
          <div className="bg-agri-cream border-b-4 border-agri-dark px-6 py-4 flex items-center justify-between">
            <h2 className="font-black text-agri-dark text-lg md:text-xl tracking-tight">
              Harga Pangan Nasional Hari Ini
            </h2>
            <span className="hidden md:inline-block bg-agri-forest text-white font-black text-xs px-3 py-1 border-4 border-agri-dark rounded-lg">
              LIVE
            </span>
          </div>
          <table className="w-full">
            <thead className="bg-agri-cream border-b-4 border-agri-dark">
              <tr className="text-left">
                <th className="px-6 py-3 font-black text-agri-dark">Komoditas</th>
                <th className="px-6 py-3 font-black text-agri-dark">Harga / Kg</th>
                <th className="px-6 py-3 font-black text-agri-dark text-right">Tren</th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((row, i) => (
                <tr
                  key={row.name}
                  className={i !== priceData.length - 1 ? "border-b-4 border-agri-dark" : ""}
                >
                  <td className="px-6 py-4 font-bold text-agri-dark">{row.name}</td>
                  <td className="px-6 py-4 font-black text-agri-dark">{row.price}</td>
                  <td
                    className={`px-6 py-4 font-bold text-right ${
                      row.up ? "text-red-600" : "text-agri-forest"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {row.up ? (
                        <TrendingUp className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <TrendingDown className="w-4 h-4" strokeWidth={3} />
                      )}
                      {row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Paywall Teaser */}
      <section className="px-6 mx-auto max-w-5xl mt-12 pb-16">
        <div className="relative min-h-80 flex items-center justify-center bg-white border-4 border-agri-dark rounded-xl overflow-hidden py-16 shadow-brutal-base">
          {/* Diagonal SVG pattern */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="diagonal-lines"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="20" stroke="#283F24" strokeWidth="4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)" opacity="0.15" />
          </svg>

          <div className="relative z-10 bg-agri-amber border-4 border-agri-dark p-8 md:p-12 rounded-xl shadow-brutal-base flex flex-col items-center text-center max-w-2xl mx-4">
            <div className="inline-flex items-center gap-2 bg-agri-dark text-agri-amber font-black px-4 py-2 border-4 border-agri-dark rounded-xl mb-4 uppercase text-xs tracking-tight">
              <Lock className="w-4 h-4" strokeWidth={3} /> Premium
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-agri-dark tracking-tight leading-tight">
              Akses Prediksi Harga H+7!
            </h2>
            <p className="mt-4 font-bold text-agri-dark/80 max-w-md">
              Gunakan model prediksi kami untuk mengantisipasi pergerakan harga satu minggu ke
              depan. Ideal untuk petani, pedagang, dan distributor.
            </p>
            <button
              onClick={() => alert("Open Payment Modal")}
              className="mt-6 bg-agri-dark text-white font-black text-lg px-8 py-4 border-4 border-agri-dark rounded-xl shadow-brutal-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-hover"
            >
              Gabung Premium
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
