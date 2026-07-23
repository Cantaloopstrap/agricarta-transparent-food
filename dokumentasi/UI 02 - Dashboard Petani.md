# **UI 02: Dashboard Petani (/petani)**

Halaman ini berfungsi sebagai portal bagi petani untuk melihat galeri hasil panen yang berhasil dilaporkan (di-ingest) via WhatsApp Bot.

## **1\. Layout Overview (Wireframe)**

\======================================================  
\[Navbar: LOGO                           \[ Beli Premium \] \]  
\======================================================  
.  
.  \[ FILTER BAR \]  
.  \[ Cari Komoditas... \] \[ Filter Tanggal V \]  
.  
.  \[ HARVEST GRID \]  
.  \+----------------+  \+----------------+  \+----------------+  
.  | \[ FOTO PANEN \] |  | \[ FOTO PANEN \] |  | \[ FOTO PANEN \] |  
.  | (x) Verified   |  | (x) Verified   |  | (x) Verified   |  
.  | Cabai \- 50kg   |  | Bawang \- 20kg  |  | Tomat \- 100kg  |  
.  \+----------------+  \+----------------+  \+----------------+  
.  
\======================================================

## **2\. Component Breakdown**

* FilterBar: Menampung input pencarian dan *dropdown* filter.  
* HarvestGrid: Komponen pembungkus (Grid layout) untuk memetakan data.  
* HarvestCard: Kartu individual yang menampilkan foto, label komoditas, bobot, dan *badge* terverifikasi.

## **3\. Tailwind Styling & Spacing Rules**

* **Filter Bar:**  
  * Container: bg-agri-cream p-4 rounded-xl border-4 border-agri-dark mb-8 mx-6 lg:mx-auto max-w-7xl flex gap-4 mt-28  
  * Input Fields: border-2 border-agri-dark bg-white rounded-lg px-4 py-2 font-bold text-agri-dark outline-none focus:ring-4 focus:ring-agri-amber transition-shadow  
* **Harvest Grid:**  
  * Container: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 pb-12 max-w-7xl mx-auto  
* **Harvest Card (Card Element):**  
  * Container: relative bg-white p-5 border-4 border-agri-dark rounded-xl shadow-\[6px\_6px\_0\_0\_\#283F24\] flex flex-col  
  * Image Container: aspect-square bg-gray-100 border-2 border-agri-dark rounded-lg mb-4 overflow-hidden  
  * Text Info: font-black text-xl text-agri-dark mt-2  
  * Verified Badge: absolute top-7 right-7 bg-agri-forest text-white text-xs font-bold px-2 py-1 rounded-md border-2 border-agri-dark shadow-sm

## **4\. Interactive States**

* **Filter Input Active:** Saat *user* mengetik di input pencarian, pastikan cincin kuning tebal (focus:ring-4 focus:ring-agri-amber) muncul jelas untuk aksesibilitas *high-contrast*.  
* **Card Hover:** Kartu dapat diklik untuk melihat detail gambar besar. Gunakan efek brutalist: cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-brutal-hover pada HarvestCard.  
* **Image Loading:** Tampilkan kotak bg-agri-cream animate-pulse pada Image Container selama *image asset* (dari Supabase Storage) sedang diunduh.