import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileText, Sparkles } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlobalNavbar } from "@/components/GlobalNavbar";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Dashboard Premium — Agrikarta" },
      {
        name: "description",
        content:
          "Akses prediksi harga komoditas H+7, grafik confidence interval, dan ekspor data CSV/PDF.",
      },
      { property: "og:title", content: "Dashboard Premium — Agrikarta" },
      {
        property: "og:description",
        content: "Prediksi harga komoditas 7 hari ke depan berbasis machine learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPremium,
});

type ChartRow = {
  day: string;
  actual?: number;
  predicted?: number;
  band?: [number, number];
};

function buildData(): ChartRow[] {
  const historical = [28000, 29500, 30200, 31000, 30500, 32000, 33500];
  const predicted = [34000, 35200, 34800, 36000, 37500, 37000, 38500];
  const spread = [800, 1000, 1200, 1400, 1600, 1800, 2000];

  const rows: ChartRow[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    rows.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      actual: historical[6 - i],
    });
  }
  // Bridge: last actual carries into predicted for a connected line
  rows[rows.length - 1].predicted = historical[6];
  rows[rows.length - 1].band = [historical[6], historical[6]];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const p = predicted[i - 1];
    rows.push({
      day: `${d.getDate()}/${d.getMonth() + 1}`,
      predicted: p,
      band: [p - spread[i - 1], p + spread[i - 1]],
    });
  }

  return rows;
}

const DATA = buildData();

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function BrutalTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
  const predicted = payload.find((p: any) => p.dataKey === "predicted")?.value;
  return (
    <div className="bg-white border-2 border-agri-dark p-3 font-bold text-agri-dark shadow-brutal-sm rounded-md">
      <div className="font-black text-sm mb-1">Hari {label}</div>
      {typeof actual === "number" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-3 h-3 bg-agri-forest border border-agri-dark" />
          Aktual: {formatRupiah(actual)}
        </div>
      )}
      {typeof predicted === "number" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-3 h-3 bg-agri-amber border border-agri-dark" />
          Prediksi: {formatRupiah(predicted)}
        </div>
      )}
    </div>
  );
}

function DashboardPremium() {
  const handlePdf = () => {
    console.log("Generating file client-side...");
    alert("PDF (dummy) sedang dibuat client-side.");
  };
  const handleCsv = () => {
    console.log("Generating file client-side...");
    alert("CSV (dummy) sedang dibuat client-side.");
  };

  return (
    <div className="min-h-screen bg-agri-cream">
      <GlobalNavbar />

      {/* Top Banner */}
      <div className="bg-agri-amber text-agri-dark p-6 border-4 border-agri-dark rounded-xl font-black text-center text-lg md:text-2xl uppercase tracking-widest mt-28 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base flex items-center justify-center gap-3">
        <Sparkles className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
        Premium Access: Prediksi Harga Komoditas H+7
      </div>

      <div className="mt-6 mx-6 lg:mx-auto max-w-7xl">
        <h2 className="text-xl md:text-2xl font-black text-agri-dark tracking-tight">
          Cabai Rawit — Proyeksi 7 Hari
        </h2>
        <p className="font-bold text-agri-dark/70 text-sm">
          Garis hijau: harga aktual. Garis kuning putus-putus: prediksi ML. Area kuning muda:
          rentang confidence interval.
        </p>
      </div>

      {/* Recharts container */}
      <div className="bg-white p-4 md:p-6 border-4 border-agri-dark rounded-xl h-[400px] mt-4 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={DATA} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#283F24" strokeOpacity={0.15} strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              stroke="#283F24"
              strokeWidth={2}
              tick={{ fill: "#283F24", fontWeight: 700, fontSize: 12 }}
            />
            <YAxis
              stroke="#283F24"
              strokeWidth={2}
              tick={{ fill: "#283F24", fontWeight: 700, fontSize: 12 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              width={44}
            />
            <Tooltip content={<BrutalTooltip />} cursor={{ stroke: "#283F24", strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey="band"
              fill="#FFF78D"
              fillOpacity={0.8}
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#467235"
              strokeWidth={4}
              dot={{ fill: "#467235", stroke: "#283F24", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, stroke: "#283F24", strokeWidth: 2, fill: "#467235" }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#FFBF00"
              strokeWidth={4}
              strokeDasharray="5 5"
              dot={{ fill: "#FFBF00", stroke: "#283F24", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8, stroke: "#283F24", strokeWidth: 2, fill: "#FFBF00" }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap gap-4 mt-6 mx-6 lg:mx-auto max-w-7xl justify-end pb-16">
        <button
          onClick={handlePdf}
          className="bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-base flex items-center gap-2"
        >
          <FileText className="w-5 h-5" strokeWidth={3} />
          Cetak PDF
        </button>
        <button
          onClick={handleCsv}
          className="bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-base flex items-center gap-2"
        >
          <FileDown className="w-5 h-5" strokeWidth={3} />
          Ekspor Data CSV
        </button>
      </div>
    </div>
  );
}
