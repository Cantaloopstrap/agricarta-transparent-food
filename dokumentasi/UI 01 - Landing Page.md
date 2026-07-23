# **UI 01: Landing Page (/)**

Halaman utama yang berfungsi sebagai etalase publik, menampilkan tren harga berjalan dan *paywall* menuju konten premium.

## **1\. Layout Overview (Wireframe)**

\======================================================  
\[Navbar: LOGO                           \[ Beli Premium \] \]  
\======================================================  
.  
.  \[ HERO SECTION \]  
.  \[ "Harga Pangan Transparan & Akurat" (Text-5xl)  \]  
.  
.  \================================================  .  
.  | PUBLIC PRICE TABLE                           |  .  
.  | \------------------------------------------   |  .  
.  | Bawang Merah  | Rp 30.000 | \+2% (Merah)      |  .  
.  | Cabai Rawit   | Rp 45.000 | \-1% (Hijau)      |  .  
.  \================================================  .  
.  
.  \[ PAYWALL / PREMIUM TEASER \]  
.  ///////////////// SVG DIAGONAL PATTERN ////////////  
.  //  \+----------------------------------------+   //  
.  //  |      Akses Prediksi Harga H+7\!         |   //  
.  //  |         \[ Gabung Premium \]             |   //  
.  //  \+----------------------------------------+   //  
.  ///////////////////////////////////////////////////  
.  
\======================================================

## **2\. Component Breakdown**

* GlobalNavbar (Dari Shared Components)  
* HeroSection: Komponen pembungkus teks *hero* dan deskripsi singkat.  
* PublicPriceTable: Komponen tabel untuk merender data SP2KP secara publik.  
* PremiumTeaser: Kontainer blok CTA dengan *pattern* latar belakang.

## **3\. Tailwind Styling & Spacing Rules**

* **Hero Section:**  
  * Container: pt-28 pb-12 px-6 text-center max-w-7xl mx-auto flex flex-col items-center justify-center  
  * Typography: text-5xl font-black text-agri-dark tracking-tight leading-tight  
* **Public Table:**  
  * Container: bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden mx-6 lg:mx-auto max-w-4xl  
  * Header Table: bg-agri-cream border-b-4 border-agri-dark font-black text-agri-dark  
  * Tren Naik: text-red-600 font-bold  
  * Tren Turun: text-agri-forest font-bold  
* **Paywall / Premium Teaser:**  
  * Container: relative h-80 flex items-center justify-center bg-white border-4 border-agri-dark rounded-xl mt-8 mx-6 lg:mx-auto max-w-5xl overflow-hidden (Gunakan class utilitas SVG untuk overlay motif garis diagonal diagonal).  
  * Inner Box: bg-agri-amber border-4 border-agri-dark p-8 md:p-12 rounded-xl z-10 shadow-brutal-base flex flex-col items-center text-center

## **4\. Interactive States**

* **Button Hover:** Pada tombol CTA di Inner Box, gunakan hover:-translate-y-1 hover:shadow-brutal-hover transition-all.  
* **Table Loading State:** Saat fetch API dari SP2KP berjalan, render baris tabel abu-abu solid (bg-gray-200 animate-pulse border-b-2 border-agri-dark) sebagai *skeleton loader*.  
* **Paywall Click:** Saat klik "Beli Premium" atau "Gabung Premium", munculkan *Pop-up/Modal* (Gatekeeper input nomor WA) dengan *backdrop overlay* (bg-agri-dark/80 backdrop-blur-sm).