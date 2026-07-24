import React from 'react';
import { Sprout, TrendingUp, Sun, AlertTriangle } from 'lucide-react';

export const PetaniDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border-emerald-500/20">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-1">
          <Sprout className="w-4 h-4" />
          <span>UI 02 - Dashboard Petani Agrikarta</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Portal Rekomendasi Waktu Panen Petani</h1>
        <p className="text-slate-400 text-sm mt-1">
          Dapatkan saran waktu optimal penjualan hasil panen beras, cabai, dan bawang berdasarkan prediksi tren pasar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl border-emerald-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-emerald-400">Rekomendasi Waktu Panen</h3>
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-300 text-sm">
            Berdasarkan model LSTM, harga **Cabai Merah** diperkirakan mengalami kenaikan hingga **+4.2%** pada H+5. Disarankan untuk menjadwalkan panen raya pada 3-5 hari mendatang untuk keuntungan maksimal.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-amber-400">Peringatan Cuaca & Pasar</h3>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-slate-300 text-sm">
            Pasokan bawang merah wilayah Jawa Tengah terpantau stabil. Pastikan kelembapan gudang penyimpanan terjaga untuk menghindari penurunan mutu.
          </p>
        </div>
      </div>
    </div>
  );
};
