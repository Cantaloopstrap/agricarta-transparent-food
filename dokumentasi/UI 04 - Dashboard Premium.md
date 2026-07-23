# **UI 04: Dashboard Premium (/premium)**

Area khusus pengguna berbayar (*Magic Link verified*). Fitur utamanya adalah grafik Prediksi Harga H+7 (ML Output) dan ekspor dokumen *client-side*.

## **1\. Layout Overview (Wireframe)**

\======================================================  
\[Navbar: LOGO                           \[ Keluar Akun \] \]  
\======================================================  
.  
.  \[ TOP BANNER \]  
.  \[  PREMIUM ACCESS: Prediksi Harga Komoditas H+7  \]  
.  
.  \[ RECHARTS GRAPHIC \]  
.  \+------------------------------------------------+  
.  | 100k |                                         |  
.  |      |   /\\/\\                  /.. .. .. (H+7) |  
.  |  50k |  /    \\      /.\\  /..../                |  
.  |      | /      \\/\\/\\/   \\/                      |  
.  |   0  \+-----------------------------------------+  
.  |        1/8   2/8   3/8   4/8  (Hari)           |  
.  \+------------------------------------------------+  
.  
.  \[ ACTION BUTTONS \]  
.  \[ Unduh PDF (On-Demand) \]   \[ Ekspor Data CSV \]  
.  
\======================================================

## **2\. Component Breakdown**

* PremiumBanner: Pesan status/selamat datang Premium.  
* PriceChart: *Wrapper component* untuk ResponsiveContainer dari library Recharts.  
* ExportActionGroup: Komponen yang membungkus @react-pdf/renderer dan logika unduh CSV.

## **3\. Tailwind Styling & Spacing Rules**

* **Top Banner:**  
  * Container: bg-agri-amber text-agri-dark p-6 border-4 border-agri-dark rounded-xl font-black text-center text-2xl uppercase tracking-widest mt-28 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base  
* **Recharts Graphic Container:**  
  * Container: bg-white p-6 border-4 border-agri-dark rounded-xl h-\[400px\] mt-8 mx-6 lg:mx-auto max-w-7xl shadow-brutal-base  
  * **Recharts Props Configuration:**  
    * Garis Historis (\<Line\>): stroke="\#467235" strokeWidth={4} activeDot={{ r: 8, stroke: '\#283F24', strokeWidth: 2 }}.  
    * Garis Prediksi (\<Line\>): stroke="\#FFBF00" strokeWidth={4} strokeDasharray="5 5".  
    * Confidence Area (\<Area\>): fill="\#FFF78D" fillOpacity={0.8} stroke="none".  
    * Tooltip: Kustomisasi wrapper tooltip dengan class bg-white border-2 border-agri-dark p-3 font-bold text-agri-dark shadow-brutal-sm.  
* **Action Buttons (Action Row):**  
  * Container: flex gap-4 mt-6 mx-6 lg:mx-auto max-w-7xl justify-end  
  * Button: bg-white border-4 border-agri-dark text-agri-dark font-black px-6 py-3 rounded-xl shadow-brutal-sm hover:-translate-y-1 hover:shadow-brutal-base transition-all flex items-center gap-2 (Gunakan ikon SVG untuk PDF/CSV).

## **4\. Interactive States**

* **Chart Hover (Crosshair):** Tampilkan Cursor tebal pada Recharts Tooltip (misalnya garis vertikal warna \#283F24 tebal 2px).  
* **PDF Generation Loading:** Saat tombol PDF diklik, @react-pdf/renderer mungkin membutuhkan \> 500ms. Ubah *state* tombol menjadi "Menyiapkan PDF..." dan *disable* tombol tersebut (opacity-75 cursor-not-allowed) hingga Blob selesai dibuat dan terunduh.