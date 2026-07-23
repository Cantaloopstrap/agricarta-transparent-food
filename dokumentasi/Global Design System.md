# **Agrikarta Global Design System (Neobrutalism)**

Dokumen ini mendefinisikan aturan desain global untuk platform Agrikarta, berfokus pada gaya *Flat Design High Contrast (Neobrutalism)*. Aturan ini akan memastikan konsistensi visual di seluruh aplikasi.

## **1\. Color Palette (Hex Codes)**

Warna-warna ini adalah pondasi utama UI kita. Hindari penggunaan gradien; semua warna harus diaplikasikan sebagai warna solid (*flat*).

* **Agri Amber (Aksen Utama):** \#FFBF00 \- Digunakan untuk tombol utama, sorotan, dan *shadow* spesifik.  
* **Agri Cream (Background Utama):** \#FFF78D \- Digunakan untuk latar belakang aplikasi atau kartu sekunder.  
* **Agri Forest (Badge/Grafik):** \#467235 \- Digunakan untuk elemen sukses, *badge* terverifikasi, dan garis aktual pada grafik.  
* **Agri Dark (Teks & Garis):** \#283F24 \- Digunakan untuk warna teks utama, latar belakang Navbar, dan semua garis pinggir (*border*) tebal.

## **2\. Tailwind Configuration (tailwind.config.js)**

Untuk mempermudah penggunaan di seluruh komponen React, konfigurasi Tailwind di-extend sebagai berikut:

/\*\* @type {import('tailwindcss').Config} \*/  
export default {  
  content: \[  
    "./index.html",  
    "./src/\*\*/\*.{js,ts,jsx,tsx}",  
  \],  
  theme: {  
    extend: {  
      colors: {  
        'agri-amber': '\#FFBF00',  
        'agri-cream': '\#FFF78D',  
        'agri-forest': '\#467235',  
        'agri-dark': '\#283F24',  
      },  
      boxShadow: {  
        'brutal-base': '8px 8px 0 0 \#283F24',  
        'brutal-hover': '10px 10px 0 0 \#283F24',  
        'brutal-sm': '4px 4px 0 0 \#000000',  
        'brutal-card': '6px 6px 0 0 \#283F24',  
        'brutal-modal': '12px 12px 0 0 \#FFBF00', // Aksen amber untuk modal  
      },  
      fontFamily: {  
        sans: \['Space Grotesk', 'system-ui', 'sans-serif'\], // Rekomendasi font neobrutalist  
      },  
      borderWidth: {  
        '4': '4px',  
      }  
    },  
  },  
  plugins: \[\],  
}

## **3\. Universal Base Rules**

### **Typography**

* Gunakan *font-weight* tebal (font-bold atau font-black) untuk *heading* dan elemen UI penting.  
* Gunakan spasi antar huruf yang rapat (tracking-tight) untuk *heading* besar guna menegaskan kesan *chunky* ala neobrutalisme.

### **Border & Radius**

* **Garis Pinggir:** Hampir semua elemen kontainer, tombol, dan kartu wajib menggunakan border-4 border-agri-dark.  
* **Lengkungan:** Tetap pertahankan lengkungan tegas dengan rounded-xl atau rounded-lg.

### **Shadow & Interaktivitas (Hover)**

Efek 3D *faux* (bayangan padat/blok) adalah inti dari Neobrutalisme.

* **Default State:** shadow-brutal-base (atau bayangan padat relevan dari konfigurasi di atas).  
* **Hover State:** Elemen interaktif harus "terangkat" dengan transisi: transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-hover.

## **4\. Shared Component: Global Navbar**

Digunakan di seluruh halaman (kecuali portal Admin).

* **Container:** fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center bg-agri-dark border-b-4 border-agri-dark  
* **Logo:** text-white font-black text-2xl tracking-tight  
* **CTA Button:** bg-agri-amber text-agri-dark font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-\[4px\_4px\_0\_0\_\#000\] hover:-translate-y-1 hover:shadow-\[6px\_6px\_0\_0\_\#000\] transition-all