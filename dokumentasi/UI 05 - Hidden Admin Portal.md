# **UI 05: Hidden Admin Portal (/admin/dashboard)**

Akses *superuser* tersembunyi untuk memantau log sistem secara real-time (Supabase Realtime) dan menonaktifkan (*ban*) *user* atau nomor WhatsApp bermasalah.

## **1\. Layout Overview (Wireframe)**

\======================================================  
\[ ADMIN SIDEBAR \] | \[ MAIN CONTENT \]  
\[ LOGO          \] |  \=================================  
\[               \] |  | LIVE LOGS TERMINAL            |  
\[ Dashboard     \] |  | \> API Hit: /webhook/midtrans  |  
\[ Manajemen User\] |  | \> Bot: New msg from 62812...  |  
\[               \] |  | \> Model LSTM: Retraining...   |  
\[               \] |  \=================================  
\[               \] |  
\[               \] |  \[ MANAJEMEN USER TABLE \]  
\[               \] |  \---------------------------------  
\[ Logout        \] |  62812... | User A | \[ BAN USER \]  
\[               \] |  62819... | User B | \[ BAN USER \]  
\======================================================

## **2\. Component Breakdown**

* AdminLayout: *Layout* khusus (*no global navbar*) yang membungkus Sidebar dan ContentArea.  
* AdminSidebar: Menu statis vertikal di sebelah kiri.  
* LiveLogsTerminal: Komponen penampil log *real-time* yang berlangganan (*subscribe*) ke Supabase Channel.  
* UserManagementTable: Tabel data yang dirender dengan kontrol *admin action*.

## **3\. Tailwind Styling & Spacing Rules**

* **Admin Layout & Sidebar:**  
  * Page Wrapper: flex h-screen bg-agri-cream overflow-hidden  
  * Sidebar: w-64 bg-agri-dark text-white border-r-4 border-agri-dark flex flex-col p-6 shrink-0  
  * Sidebar Links: font-bold block py-3 px-4 rounded-lg hover:bg-white/10 transition-colors  
  * Main Content Area: flex-1 h-full overflow-y-auto p-8  
* **Live Logs Terminal:**  
  * Container: bg-black font-mono h-64 overflow-y-auto p-4 border-4 border-agri-dark rounded-xl shadow-brutal-base mb-8  
  * Text: text-\[\#00FF00\] text-sm leading-relaxed (Warna hijau terminal retro).  
* **User Management Table & Action Row:**  
  * Table Wrapper: bg-white border-4 border-agri-dark rounded-xl shadow-brutal-base overflow-hidden  
  * Header: bg-gray-100 border-b-4 border-agri-dark font-black text-left p-4  
  * Row: border-b-2 border-agri-dark p-4  
  * "Ban User" Button: bg-red-500 text-white font-black px-4 py-2 rounded-lg border-2 border-agri-dark shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-\[4px\_4px\_0\_0\_\#000\] active:translate-y-0 active:shadow-none transition-all

## **4\. Interactive States**

* **Live Terminal Auto-Scroll:** Gunakan useRef dan useEffect pada React (kombinasi fungsi scrollIntoView()) agar terminal secara otomatis *scroll* ke bawah setiap kali ada baris log baru (state logs bertambah).  
* **Ban User Action:**  
  1. Saat tombol "Ban" diklik, ubah teks menjadi "Banning..." dengan *spinner icon* kecil.  
  2. Picu *Supabase Client Update* (status\_active \= false).  
  3. Ubah tombol menjadi "Banned" berwarna abu-abu (bg-gray-500 cursor-not-allowed shadow-none border-gray-700) setelah berhasil.