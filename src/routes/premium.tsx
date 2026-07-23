import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileDown, FileText, Sparkles, Loader2, AlertCircle } from "lucide-react";
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

type HistoricalRow = { date: string; price: number };
type PredictionRow = {
  date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
};

type ChartRow = {
  date: string;
  day: string;
  actual?: number;
  predicted?: number;
  band?: [number, number];
};

function formatRupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
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
      <div className="font-black text-sm mb-1">Tanggal {label}</div>
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
          CI (Rentang): {formatRupiah(band[0])} – {formatRupiah(band[1])}
        </div>
      )}
    </div>
  );
}

function DashboardPremium() {
  const [commodity, setCommodity] = useState("jagung");
  const [commodityName, setCommodityName] = useState("Jagung");
  const [historicalData, setHistoricalData] = useState<HistoricalRow[]>([]);
  const [predictionData, setPredictionData] = useState<PredictionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const mlApiUrl = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

    fetch(`${mlApiUrl}/api/prices/predictions?commodity=${commodity}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data prediksi dari ML Engine.");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setCommodityName(data.commodity || commodity);
          setHistoricalData(data.historical || []);
          setPredictionData(data.prediction || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error fetching ML prediction:", err);
          setError(err.message || "Gagal memuat data dari Python ML Engine.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [commodity]);

  const chartData = useMemo(() => {
    if (!historicalData.length && !predictionData.length) return [];
    
    const shortDay = (iso: string) => {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : `${d.getDate()}/${d.getMonth() + 1}`;
    };

    const rows: ChartRow[] = historicalData.map((h) => ({
      date: h.date,
      day: shortDay(h.date),
      actual: h.price,
    }));

    if (rows.length > 0 && historicalData.length > 0) {
      const lastActual = historicalData[historicalData.length - 1];
      rows[rows.length - 1].predicted = lastActual.price;
      rows[rows.length - 1].band = [lastActual.price, lastActual.price];
    }

    for (const p of predictionData) {
      rows.push({
        date: p.date,
        day: shortDay(p.date),
        predicted: p.predicted_price,
        band: [p.lower_bound, p.upper_bound],
      });
    }

    return rows;
  }, [historicalData, predictionData]);

  const handleCsv = () => {
    if (!historicalData.length && !predictionData.length) return;
    
    const header = "date,type,price,lower_bound,upper_bound";
    const historicalRows = historicalData.map(
      (h) => `${h.date},actual,${h.price},,`
    );
    const predictionRows = predictionData.map(
      (p) =>
        `${p.date},predicted,${p.predicted_price},${p.lower_bound},${p.upper_bound}`
    );
    const csv = [header, ...historicalRows, ...predictionRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Agrikarta_Report_${commodityName}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePdf = () => {
    setPdfLoading(true);
    try {
      const reportTitle = `Laporan Prediksi Harga ${commodityName} - Agrikarta`;
      const dateStr = new Date().toLocaleDateString("id-ID");
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #283F24; }
            h1 { color: #283F24; font-size: 24px; border-bottom: 4px solid #FFBF00; padding-bottom: 8px; }
            .meta { font-size: 12px; margin-bottom: 20px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 2px solid #283F24; padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background-color: #FFBF00; }
            tr:nth-child(even) { background-color: #FFF78D; }
          </style>
        </head>
        <body>
          <h1>🌾 Agrikarta - ${reportTitle}</h1>
          <div class="meta">Tanggal Cetak: ${dateStr} | Komoditas: ${commodityName}</div>
          <h3>Historis & Proyeksi 7 Hari Ke Depan</h3>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Harga (Rp)</th>
                <th>CI Batas Bawah</th>
                <th>CI Batas Atas</th>
              </tr>
            </thead>
            <tbody>
              ${historicalData.map(h => `
                <tr>
                  <td>${h.date}</td>
                  <td>Aktual</td>
                  <td>Rp ${h.price.toLocaleString("id-ID")}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              `).join("")}
              ${predictionData.map(p => `
                <tr>
                  <td>${p.date}</td>
                  <td>Prediksi (ML)</td>
                  <td>Rp ${p.predicted_price.toLocaleString("id-ID")}</td>
                  <td>Rp ${p.lower_bound.toLocaleString("id-ID")}</td>
                  <td>Rp ${p.upper_bound.toLocaleString("id-ID")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agri-cream">
      <GlobalNavbar />

      {/* Top Banner */}
      <div className="bg-agri-amber text-agri-dark p-6 border-4 border-agri-dark rounded-xl font-black text-center text-lg md:text-2xl uppercase tracking-widest mt-28 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base flex items-center justify-center gap-3">
        <Sparkles className="w-6 h-6 md:w-7 md:h-7" strokeWidth={3} />
        Premium Access: Prediksi Harga Komoditas H+7
      </div>

      <div className="mt-6 mx-6 lg:mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-agri-dark tracking-tight">
            {commodityName} — Proyeksi 7 Hari
          </h2>
          <p className="font-bold text-agri-dark/70 text-sm">
            Garis hijau: harga aktual. Garis kuning putus-putus: prediksi PyTorch LSTM. Area kuning: confidence interval.
          </p>
        </div>

        {/* Commodity Selector */}
        <div className="flex items-center gap-2">
          <span className="font-black text-sm uppercase tracking-tight text-agri-dark">Pilih Komoditas:</span>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="bg-white border-4 border-agri-dark rounded-xl px-4 py-2 font-black text-agri-dark shadow-brutal-sm outline-none focus:ring-4 focus:ring-agri-amber transition-shadow cursor-pointer"
          >
            <option value="jagung">Jagung</option>
            <option value="cabai">Cabai</option>
            <option value="padi">Padi</option>
            <option value="bawang">Bawang</option>
            <option value="beras">Beras</option>
            <option value="minyak">Minyak</option>
          </select>
        </div>
      </div>

      {/* Loading / Error / Recharts container */}
      <div className="bg-white p-4 md:p-6 border-4 border-agri-dark rounded-xl h-[400px] mt-4 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-12 h-12 text-agri-dark animate-spin mb-3" strokeWidth={3} />
            <p className="font-black text-agri-dark">Memuat data dari Python ML Engine...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-10 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" strokeWidth={3} />
            <p className="font-black text-red-600 text-lg">{error}</p>
            <button
              onClick={() => setCommodity(commodity)}
              className="mt-4 bg-agri-amber border-2 border-agri-dark font-black px-4 py-2 rounded-lg shadow-brutal-sm"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
                width={48}
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
        )}
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap gap-4 mt-6 mx-6 lg:mx-auto max-w-7xl justify-end pb-16">
        <button
          onClick={handlePdf}
          disabled={pdfLoading || isLoading}
          className={`bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-base flex items-center gap-2 ${
            pdfLoading || isLoading ? "opacity-75 cursor-not-allowed hover:translate-y-0 hover:shadow-brutal-sm" : ""
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
          disabled={isLoading || (!historicalData.length && !predictionData.length)}
          className="bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-base flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-5 h-5" strokeWidth={3} />
          Ekspor Data CSV
        </button>
      </div>
    </div>
  );
}
