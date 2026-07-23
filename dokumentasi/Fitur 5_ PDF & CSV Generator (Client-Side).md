# **1\. Judul & Ringkasan Fitur**

**Fitur:** PDF & CSV Generator (Client-Side)

**Ringkasan:** Fitur eksklusif khusus pengguna Premium untuk mengekspor data laporan dan prediksi (yang tampil di *chart*) ke format PDF atau CSV. Untuk efisiensi biaya server (tanpa API PDF generator), proses *rendering* dan konversi data dilakukan langsung di *browser* (Client-Side) secara *on-demand*.

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Repo 1 (PWA Frontend \- React)  
* **Tech Stack:** React, @react-pdf/renderer (untuk PDF via WebAssembly/Canvas), Blob API/FileSaver.js (untuk ekspor CSV mentah), Zustand (Akses State).

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **Verifikasi Gatekeeper:** User mengakses halaman /premium. PWA memastikan state *auth* user memiliki is\_premium: true.  
2. **Koleksi Data Internal:** Grafik Recharts menampilkan data yang sudah berada di memori aplikasi (di-*fetch* via API).  
3. **Trigger Aksi Ekspor:** User memencet tombol Brutalist "Cetak PDF" atau "Download CSV" di bawah grafik.  
4. **Eksekusi Blob CSV (Jika CSV dipilih):**  
   * React me-mapping Array of JSON menjadi *string* format CSV koma *delimiter*.  
   * Dikonversi ke Blob.  
   * Men-trigger tag \<a\> HTML dinamis untuk men-download file ke memori lokal HP/PC pengguna.  
5. **Eksekusi @react-pdf (Jika PDF dipilih):**  
   * *PDF Document Component* di-inject dengan data JSON *current chart state*.  
   * Library merender elemen \<Page\>, \<Text\>, \<View\> menjadi file PDF di *browser engine*.  
   * Browser men-trigger aksi download file Agrikarta\_Report\_...pdf.

# **4\. Spesifikasi Payload / Interaksi Data**

**Internal Frontend State (Input untuk Generator):**

Data tidak menyeberang *network request* lagi, tetapi murni me-lempar data state React ke fungsi Generator.

const chartData \= \[  
  { date: '22 Jul 2026', type: 'Aktual', value: 5000 },  
  { date: '23 Jul 2026', type: 'Prediksi', value: 5150 }  
\];

// Logic CSV Stringifier  
const csvContent \= "data:text/csv;charset=utf-8,"   
    \+ chartData.map(e \=\> Object.values(e).join(",")).join("\\n");

# **5\. Skema Target Database & Mutasi Data**

* **Tidak Ada Mutasi Database.** Fitur ini bersifat Read-Only pada sisi Client dan murni mengeksploitasi kapabilitas *browser engine*. Ini mendukung filosofi arsitektur yang ringan dari sisi infrastruktur server (*Serverless mindset*).

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: Performa Lemot di HP Low-End (Out of Memory).**  
  * *Penanganan:* @react-pdf/renderer bisa memakan RAM di HP spesifikasi rendah. Jika data JSON berjumlah \>1000 baris (*row*), Frontend secara otomatis membatasi render ekspor maksimal untuk 30 hari data terakhir.  
* **Edge Case 2: Pop-up / Download Diblokir Browser (Safari / In-App Browser).**  
  * *Penanganan:* Alih-alih membuka *new tab* (target="\_blank"), gunakan URL createObjectURL dari Blob dan pasang atribut download="filename.pdf" di tag anchor \<a\>. Munculkan *Toast* pemberitahuan "File sedang diunduh... periksa folder Downloads Anda."  
* **Edge Case 3: User Mencoba Hack via Inspect Element untuk Bypass Premium.**  
  * *Penanganan:* Endpoint API yang mensuplai data /api/prices/predictions memiliki *middleware* backend yang mengecek Bearer token JWT premium. Tanpa bayar, JSON data prediksinya tidak akan pernah diterima Frontend, sehingga PDF/CSV yang di-generate akan kosong.