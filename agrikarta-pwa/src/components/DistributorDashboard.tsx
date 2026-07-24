import React from 'react';
import { Truck, MapPin, PackageCheck, Clock } from 'lucide-react';

export const DistributorDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border-blue-500/20">
        <div className="flex items-center space-x-2 text-blue-400 font-semibold text-sm mb-1">
          <Truck className="w-4 h-4" />
          <span>UI 03 - Dashboard Distributor Agrikarta</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Manajemen Pasokan & Logistik Distribusi Pangan</h1>
        <p className="text-slate-400 text-sm mt-1">
          Pantau kelancaran alur pasokan pangan antar wilayah dan mitigasi resiko lonjakan harga pasar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Status Armada Rute Utama</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">12 Pengiriman</div>
          <div className="text-xs text-emerald-400 mt-1">✓ 100% On-time delivery</div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Kapasitas Stok Gudang</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">84.5 Ton</div>
          <div className="text-xs text-slate-400 mt-1">Stok Beras & Bawang Merah</div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Estimasi Arrive Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">3.4 Jam</div>
          <div className="text-xs text-slate-400 mt-1">Rute Subang - Jakarta</div>
        </div>
      </div>
    </div>
  );
};
