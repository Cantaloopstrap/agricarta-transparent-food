import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface HistoricalPoint {
  date: string;
  price: number;
}

interface PredictionPoint {
  date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
}

interface PredictionResponse {
  commodity: string;
  historical: HistoricalPoint[];
  prediction: PredictionPoint[];
}

interface CombinedChartPoint {
  date: string;
  formattedDate: string;
  actualPrice: number | null;
  predictedPrice: number | null;
  confidenceBand: [number, number] | null;
  lowerBound: number | null;
  upperBound: number | null;
}

export const PremiumDashboard: React.FC = () => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('beras');
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPredictions = async (commodity: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/prices/predictions?commodity=${commodity}`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const json: PredictionResponse = await response.json();
      setData(json);
    } catch (err: any) {
      console.warn("Backend ML offline or CORS block, activating realistic fallback simulation data.", err);
      // Fallback generator if FastAPI server is not started yet
      const today = new Date();
      const mockHist: HistoricalPoint[] = Array.from({ length: 20 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (20 - i));
        return {
          date: d.toISOString().split('T')[0],
          price: Math.round(14500 + Math.sin(i) * 300 + (Math.random() * 200))
        };
      });

      const lastHistPrice = mockHist[mockHist.length - 1].price;
      const mockPred: PredictionPoint[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + (i + 1));
        const predVal = Math.round(lastHistPrice + (i + 1) * 80 + Math.cos(i) * 150);
        return {
          date: d.toISOString().split('T')[0],
          predicted_price: predVal,
          lower_bound: Math.round(predVal - 400 - (i * 50)),
          upper_bound: Math.round(predVal + 400 + (i * 50))
        };
      });

      setData({
        commodity: commodity.toUpperCase(),
        historical: mockHist,
        prediction: mockPred
      });
      setError("Gunakan data simulasi offline (Pastikan ML Engine berjalan di http://localhost:8000)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions(selectedCommodity);
  }, [selectedCommodity]);

  const handleDownloadPDF = () => {
    showToast("Mengunduh Laporan Lanjutan LSTM Prediksi PDF...");
    // Future PDF Export Logic
  };

  const handleExportCSV = () => {
    if (!data) return;
    showToast("Mengekspor Dataset Hasil Prediksi Ke CSV...");

    let csvContent = "data:text/csv;charset=utf-8,Tanggal,Tipe,Harga (Rp),Lower Bound,Upper Bound\n";
    data.historical.forEach(h => {
      csvContent += `${h.date},Historis,${h.price},,\n`;
    });
    data.prediction.forEach(p => {
      csvContent += `${p.date},Prediksi,${p.predicted_price},${p.lower_bound},${p.upper_bound}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Prediksi_Harga_${data.commodity}_7Hari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Process chart data by stitching historical + predictions
  const chartPoints: CombinedChartPoint[] = React.useMemo(() => {
    if (!data) return [];
    const points: CombinedChartPoint[] = [];

    // Push Historical Points
    data.historical.forEach((item) => {
      const dt = new Date(item.date);
      points.push({
        date: item.date,
        formattedDate: `${dt.getDate()}/${dt.getMonth() + 1}`,
        actualPrice: item.price,
        predictedPrice: null,
        confidenceBand: null,
        lowerBound: null,
        upperBound: null
      });
    });

    // Stitch last historical point into prediction start for smooth line connection
    if (data.historical.length > 0 && data.prediction.length > 0) {
      const lastH = data.historical[data.historical.length - 1];
      points[points.length - 1].predictedPrice = lastH.price;
      points[points.length - 1].confidenceBand = [lastH.price, lastH.price];
    }

    // Push Prediction Points
    data.prediction.forEach((item) => {
      const dt = new Date(item.date);
      points.push({
        date: item.date,
        formattedDate: `${dt.getDate()}/${dt.getMonth() + 1} (H+${data.prediction.indexOf(item) + 1})`,
        actualPrice: null,
        predictedPrice: item.predicted_price,
        confidenceBand: [item.lower_bound, item.upper_bound],
        lowerBound: item.lower_bound,
        upperBound: item.upper_bound
      });
    });

    return points;
  }, [data]);

  // Key Statistics
  const latestActual = data?.historical[data.historical.length - 1]?.price || 0;
  const target7DayPred = data?.prediction[data.prediction.length - 1]?.predicted_price || 0;
  const priceChange = target7DayPred - latestActual;
  const percentChange = latestActual > 0 ? ((priceChange / latestActual) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-2xl font-medium animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-6 rounded-2xl border-emerald-500/20">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4" />
            <span>UI 04 - Dashboard Premium Agrikarta</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Analisis & Prediksi Harga Pangan (PyTorch LSTM)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Visualisasi deret waktu historis dan forecasting 7 hari ke depan dengan Confidence Interval 95%.
          </p>
        </div>

        {/* Commodity Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="beras">🌾 Beras Medium</option>
            <option value="cabai merah">🌶️ Cabai Merah</option>
            <option value="bawang merah">🧅 Bawang Merah</option>
          </select>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={() => fetchPredictions(selectedCommodity)}
            className="flex items-center space-x-1 underline hover:text-amber-100"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Harga Aktual Terkini</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white">
            Rp {latestActual.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Data historis pasar terverifikasi</div>
        </div>

        <div className="glass-card p-5 rounded-2xl glass-card-hover border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Prediksi Target H+7</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-400">
            Rp {target7DayPred.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center space-x-1 text-xs mt-1 font-semibold">
            {priceChange >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> +{percentChange}% (Naik Rp {priceChange.toLocaleString('id-ID')})
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <ArrowDownRight className="w-3 h-3 mr-0.5" /> {percentChange}% (Turun Rp {Math.abs(priceChange).toLocaleString('id-ID')})
              </span>
            )}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl glass-card-hover">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Confidence Range (95%)</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-200">
            Rp {data?.prediction[6]?.lower_bound.toLocaleString('id-ID')} - Rp {data?.prediction[6]?.upper_bound.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Batas Atas & Batas Bawah Estimasi</div>
        </div>
      </div>

      {/* Main Recharts Chart Card */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Grafik Deret Waktu & Forecast PyTorch LSTM</span>
            </h3>
            <p className="text-xs text-slate-400">
              Garis solid menunjukkan harga aktual, garis putus-putus menunjukkan proyeksi 7 hari, dan area terang menunjukkan Confidence Interval.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-300">Historis</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-amber-400 border border-dashed border-amber-400 inline-block"></span>
              <span className="text-slate-300">Prediksi 7 Hari</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block"></span>
              <span className="text-slate-300">Confidence Band</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[380px] w-full pt-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Memuat data prediksi dari ML Engine...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartPoints} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `Rp ${val.toLocaleString('id-ID')}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (Array.isArray(value)) {
                      return [`Rp ${value[0].toLocaleString('id-ID')} - Rp ${value[1].toLocaleString('id-ID')}`, 'Confidence Interval'];
                    }
                    if (typeof value === 'number') {
                      return [`Rp ${value.toLocaleString('id-ID')}`, name === 'actualPrice' ? 'Harga Aktual' : 'Prediksi LSTM'];
                    }
                    return [value, name];
                  }}
                />
                <Legend />

                {/* 1. Confidence Area Band */}
                <Area
                  type="monotone"
                  dataKey="confidenceBand"
                  name="Confidence Band (95%)"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  fill="url(#confidenceGradient)"
                />

                {/* 2. Historical Actual Line */}
                <Line
                  type="monotone"
                  dataKey="actualPrice"
                  name="Harga Aktual (Historis)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                  connectNulls={true}
                />

                {/* 3. LSTM Prediction Dashed Line */}
                <Line
                  type="monotone"
                  dataKey="predictedPrice"
                  name="Prediksi LSTM (7 Hari)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#f59e0b' }}
                  activeDot={{ r: 7 }}
                  connectNulls={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
