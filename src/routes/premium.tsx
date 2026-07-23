import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileDown, FileText, Sparkles, Loader2 } from "lucide-react";
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

// LSTM output shape per spec
type HistoricalRow = { date: string; price: number };
type PredictionRow = {
  date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
};

const HISTORICAL: HistoricalRow[] = [
  { date: "2026-07-17", price: 28000 },
  { date: "2026-07-18", price: 29500 },
  { date: "2026-07-19", price: 30200 },
  { date: "2026-07-20", price: 31000 },
  { date: "2026-07-21", price: 30500 },
  { date: "2026-07-22", price: 32000 },
  { date: "2026-07-23", price: 33500 },
];

const PREDICTION: PredictionRow[] = [
  { date: "2026-07-24", predicted_price: 34000, lower_bound: 33200, upper_bound: 34800 },
  { date: "2026-07-25", predicted_price: 35200, lower_bound: 34200, upper_bound: 36200 },
  { date: "2026-07-26", predicted_price: 34800, lower_bound: 33600, upper_bound: 36000 },
  { date: "2026-07-27", predicted_price: 36000, lower_bound: 34600, upper_bound: 37400 },
  { date: "2026-07-28", predicted_price: 37500, lower_bound: 35900, upper_bound: 39100 },
  { date: "2026-07-29", predicted_price: 37000, lower_bound: 35200, upper_bound: 38800 },
  { date: "2026-07-30", predicted_price: 38500, lower_bound: 36500, upper_bound: 40500 },
];

type ChartRow = {
  date: string;
  day: string;
  actual?: number;
  predicted?: number;
  band?: [number, number];
};

function buildChartData(): ChartRow[] {
  const shortDay = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const rows: ChartRow[] = HISTORICAL.map((h) => ({
    date: h.date,
    day: shortDay(h.date),
    actual: h.price,
  }));
  // Bridge point
  const lastActual = HISTORICAL[HISTORICAL.length - 1];
  rows[rows.length - 1].predicted = lastActual.price;
  rows[rows.length - 1].band = [lastActual.price, lastActual.price];

  for (const p of PREDICTION) {
    rows.push({
      date: p.date,
      day: shortDay(p.date),
      predicted: p.predicted_price,
      band: [p.lower_bound, p.upper_bound],
    });
  }
  return rows;
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function BrutalTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
  const predicted = payload.find((p: any) => p.dataKey === "predicted")?.value;
  const band = payload.find((p: any) => p.dataKey === "band")?.value as
    | [number, number]
    | undefined;
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
      {band && band[0] !== band[1] && (
        <div className="text-xs mt-1 text-agri-dark/70">
          CI: {formatRupiah(band[0])} – {formatRupiah(band[1])}
        </div>
      )}
    </div>
  );
}

function DashboardPremium() {
  const DATA = useMemo(buildChartData, []);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCsv = () => {
    console.log("Generating file client-side...");
    const header = "date,type,price,lower_bound,upper_bound";
    const historicalRows = HISTORICAL.map(
      (h) => `${h.date},actual,${h.price},,`,
    );
    const predictionRows = PREDICTION.map(
      (p) =>
        `${p.date},predicted,${p.predicted_price},${p.lower_bound},${p.upper_bound}`,
    );
    const csv = [header, ...historicalRows, ...predictionRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Agrikarta_Report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePdf = () => {
    console.log("Generating file client-side...");
    setPdfLoading(true);
    setTimeout(() => {
      setPdfLoading(false);
      alert("Simulating PDF download using @react-pdf/renderer...");
    }, 1500);
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
          disabled={pdfLoading}
          className={`bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-base flex items-center gap-2 ${
            pdfLoading ? "opacity-75 cursor-not-allowed hover:translate-y-0 hover:shadow-brutal-sm" : ""
          }`}
        >
          {pdfLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
              Menyiapkan PDF...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" strokeWidth={3} />
              Cetak PDF
            </>
          )}
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
