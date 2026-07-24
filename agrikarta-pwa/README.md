# 🌾 AgriCarta PWA Frontend Platform

**AgriCarta PWA** adalah aplikasi antarmuka pengguna Progressive Web App (PWA) berbasis React dan Vite yang menyediakan antarmuka visualisasi harga pangan transparan, estimasi waktu panen, logistik distribusi, dan grafik forecasting Machine Learning PyTorch LSTM.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📋 Prerequisites

Sebelum menjalankan antarmuka frontend, pastikan sistem Anda telah memiliki:
- **Node.js**: v18.0.0 atau lebih baru
- **npm** (atau `bun` / `yarn`)

---

## ⚙️ Setup & Instalasi Lokal

1. **Masuk ke direktori repositori frontend:**
   ```bash
   cd agrikarta-pwa
   ```

2. **Install seluruh modul dependensi:**
   ```bash
   npm install
   ```

---

## 🚀 Menjalankan Server Development

Jalankan perintah berikut untuk mengaktifkan dev server Vite:

```bash
npm run dev
```

Aplikasi PWA dapat diakses melalui browser di:
- **Local Application URL:** `http://localhost:5173`

---

## 🏛️ Fitur Utama & Dashboard

Antarmuka AgriCarta PWA terdiri dari 4 modul antarmuka:

1. **UI 04 - Dashboard Premium** (`/`):
   - Integrasi real-time via `HTTP GET` ke `AgriCarta ML Engine` (`http://localhost:8000/api/prices/predictions`).
   - Visualisasi grafik `Recharts` menggabungkan:
     - **Garis Solid Hijau**: Harga Aktual Historis.
     - **Garis Putus-putus Amber**: Prediksi LSTM 7 Hari.
     - **Confidence Band**: Area gradien estimasi 95% Confidence Interval.
   - Antarmuka tombol ekspor laporan **PDF** dan **CSV**.

2. **UI 02 - Dashboard Petani** (`/petani`):
   - Rekomendasi waktu panen raya dan waktu jual optimal untuk memaksimalkan keuntungan petani.

3. **UI 03 - Dashboard Distributor** (`/distributor`):
   - Monitoring armada logistik, pasokan pangan antar-wilayah, dan kapasitas stok gudang.

4. **UI 05 - Hidden Admin Portal** (`/admin/dashboard`):
   - Audit system logs real-time dan antarmuka manajemen akses pengguna (*Ban/Unban User*).

---

## 📦 Build untuk Production

Untuk menghasilkan bundle production yang teroptimasi:

```bash
npm run build
```

Hasil build akan berada di direktori `/dist` dan siap di-deploy ke hosting statis seperti Cloudflare Pages, Vercel, atau Netlify.
