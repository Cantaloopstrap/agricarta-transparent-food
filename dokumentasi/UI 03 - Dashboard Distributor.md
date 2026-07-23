# **UI 03: Dashboard Distributor (/distributor)**

Menampilkan daftar distributor atau pengepul. Terdapat modal interaktif yang dihitung dari *webhook* Google Form untuk menilai kualitas, disiplin, sikap, dan kejujuran distributor.

## **1\. Layout Overview (Wireframe)**

\======================================================  
\[Navbar: LOGO                           \[ Beli Premium \] \]  
\======================================================  
.  
.  \[ DISTRIBUTOR LIST \]  
.  \+-----------------------+  \+-----------------------+  
.  | UD. Makmur Tani       |  | PT. Agro Sejahtera    |  
.  | \[ \* \* \* \* \* \] 4.8     |  | \[ \* \* \* \* . \] 3.9     |  
.  | (Klik untuk Persona)  |  | (Klik untuk Persona)  |  
.  \+-----------------------+  \+-----------------------+  
.  
\======\[ MODAL OVERLAY (Muncul saat kartu diklik) \]======  
.     \+----------------------------------------+  
.     | Persona: UD. Makmur Tani          \[X\]  |  
.     | \-------------------------------------- |  
.     | Kualitas:  \[==============      \] 75%  |  
.     | Disiplin:  \[=================   \] 90%  |  
.     | Sikap:     \[================    \] 85%  |  
.     | Kejujuran: \[==================  \] 95%  |  
.     \+----------------------------------------+  
\======================================================

## **2\. Component Breakdown**

* DistributorGrid: Grid *layout* pembungkus.  
* DistributorCard: Kartu data utama.  
* StarRating: Komponen pe-render SVG Bintang.  
* PersonaModal: Komponen *pop-up* yang dikontrol via *state* (misal: selectedDistributor).  
* ProgressBar: Komponen baris horizontal pengukur parameter (0-100%).

## **3\. Tailwind Styling & Spacing Rules**

* **Distributor Card:**  
  * Container: bg-agri-cream border-4 border-agri-dark rounded-xl p-6 shadow-brutal-card cursor-pointer hover:-translate-y-1 hover:shadow-brutal-hover transition-all  
  * Title: text-2xl font-black text-agri-dark mb-2  
* **Star Rating Element:**  
  * SVG Container: flex gap-1  
  * Star SVG Path: Bintang penuh (fill-agri-amber stroke-agri-dark stroke-2), Bintang kosong (fill-white stroke-agri-dark stroke-2).  
* **Modal Persona (Backdrop & Container):**  
  * Backdrop: fixed inset-0 z-\[100\] bg-agri-dark/80 backdrop-blur-sm flex items-center justify-center p-4  
  * Modal UI: relative bg-white border-4 border-agri-dark shadow-\[12px\_12px\_0\_0\_\#FFBF00\] p-8 max-w-md w-full rounded-xl  
* **Progress Bar Element:**  
  * Label: font-bold text-agri-dark mb-1 flex justify-between  
  * Track (Background): bg-white border-2 border-agri-dark h-6 rounded-full w-full overflow-hidden  
  * Indicator (Isian): bg-agri-amber border-r-2 border-agri-dark h-full transition-all duration-700 ease-out (gunakan *inline-style* untuk width: ${value}%).

## **4\. Interactive States**

* **Card Click Effect:** Selain efek *hover*, berikan *active state* active:translate-y-0 active:shadow-brutal-sm saat kartu diklik agar terasa mekanis/keras seperti tombol fisik.  
* **Modal Mount Animation:** Tambahkan animasi animate-fade-in-up (*custom tailwind keyframe*) pada kontainer Modal agar muncul dari bawah secara halus (namun cepat).  
* **Close Button Modal:** Tombol \[X\] di ujung kanan atas modal menggunakan absolute top-4 right-4 bg-red-500 text-white font-black border-2 border-agri-dark px-3 py-1 rounded hover:bg-red-600 shadow-brutal-sm.