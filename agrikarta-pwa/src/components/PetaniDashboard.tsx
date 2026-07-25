import React, { useState } from 'react';

interface HarvestItem {
  id: string;
  commodity: string;
  weight: number;
  farmer: string;
  date: string;
  verified: boolean;
  imageLoaded: boolean;
}

export const PetaniDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('semua');

  const [harvests] = useState<HarvestItem[]>([
    { id: 'h1', commodity: 'Cabai Merah', weight: 50, farmer: 'Budi Santoso', date: '2026-07-24', verified: true, imageLoaded: true },
    { id: 'h2', commodity: 'Bawang Merah', weight: 20, farmer: 'Sri Wahyuni', date: '2026-07-23', verified: true, imageLoaded: true },
    { id: 'h3', commodity: 'Tomat', weight: 100, farmer: 'Ahmad Fauzi', date: '2026-07-23', verified: false, imageLoaded: true },
    { id: 'h4', commodity: 'Jagung Pipilan', weight: 75, farmer: 'Dewi Lestari', date: '2026-07-22', verified: true, imageLoaded: false },
    { id: 'h5', commodity: 'Padi Gabah', weight: 200, farmer: 'Sujatmiko', date: '2026-07-22', verified: true, imageLoaded: true },
    { id: 'h6', commodity: 'Beras Medium', weight: 150, farmer: 'Anisa Putri', date: '2026-07-21', verified: true, imageLoaded: false },
  ]);

  const filtered = harvests.filter(h =>
    h.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.farmer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* ═══ Filter Bar ═══ */}
      <div className="bg-agri-cream p-4 rounded-xl border-4 border-agri-dark mb-8 mx-6 lg:mx-auto max-w-7xl flex flex-col sm:flex-row gap-4 mt-28">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Cari komoditas atau petani..."
          className="flex-1 border-2 border-agri-dark bg-white rounded-lg px-4 py-2 font-bold text-agri-dark outline-none focus:ring-4 focus:ring-agri-amber transition-shadow"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border-2 border-agri-dark bg-white rounded-lg px-4 py-2 font-bold text-agri-dark outline-none focus:ring-4 focus:ring-agri-amber transition-shadow cursor-pointer"
        >
          <option value="semua">📅 Semua Tanggal</option>
          <option value="hari-ini">Hari Ini</option>
          <option value="minggu-ini">Minggu Ini</option>
          <option value="bulan-ini">Bulan Ini</option>
        </select>
      </div>

      {/* ═══ Harvest Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 pb-12 max-w-7xl mx-auto">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="relative bg-white p-5 border-4 border-agri-dark rounded-xl shadow-[6px_6px_0_0_#283F24] flex flex-col cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-brutal-hover"
          >
            {/* Verified Badge */}
            {item.verified && (
              <span className="absolute top-7 right-7 bg-agri-forest text-white text-xs font-bold px-2 py-1 rounded-md border-2 border-agri-dark shadow-sm z-10">
                ✓ Verified
              </span>
            )}

            {/* Image Container */}
            <div className="aspect-square bg-gray-100 border-2 border-agri-dark rounded-lg mb-4 overflow-hidden flex items-center justify-center">
              {item.imageLoaded ? (
                <div className="w-full h-full bg-agri-cream/50 flex items-center justify-center">
                  <span className="text-6xl">
                    {item.commodity.includes('Cabai') ? '🌶️' :
                     item.commodity.includes('Bawang') ? '🧅' :
                     item.commodity.includes('Tomat') ? '🍅' :
                     item.commodity.includes('Jagung') ? '🌽' :
                     item.commodity.includes('Padi') ? '🌾' :
                     item.commodity.includes('Beras') ? '🍚' : '🌱'}
                  </span>
                </div>
              ) : (
                <div className="w-full h-full bg-agri-cream animate-pulse" />
              )}
            </div>

            {/* Text Info */}
            <h3 className="font-black text-xl text-agri-dark mt-2">{item.commodity}</h3>
            <p className="font-bold text-agri-dark/70 text-sm">{item.weight} kg — {item.farmer}</p>
            <p className="text-xs text-agri-dark/50 font-medium mt-1">{item.date}</p>
          </div>
        ))}
      </div>
    </>
  );
};
