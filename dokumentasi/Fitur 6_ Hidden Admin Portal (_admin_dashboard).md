# **1\. Judul & Ringkasan Fitur**

**Fitur:** Hidden Admin Portal

**Ringkasan:** Halaman manajemen dan *monitoring* khusus administrator (Superuser) yang dirancang tanpa *entry point* di UI publik. Fitur ini memuat log *real-time* berbasis websocket dan *command-center* untuk memblokir (*ban*) *user/spammer*, dibangun dengan arsitektur *Neobrutalism* khas platform.

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Repo 1 (PWA Frontend) dipadukan dengan Database/Backend.  
* **Tech Stack:** React (Frontend), Supabase Realtime (Websockets for Live Logs), Supabase Auth / PostgreSQL (RBAC / Row Level Security).

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **Hidden Navigation:** Admin secara sadar mengetik https://agrikarta.app/admin/dashboard pada URL bar.  
2. **Access Control (RLS & Auth Check):**  
   * Frontend mengecek apakah Token JWT saat ini memiliki klaim role: 'admin'. Jika tidak, *redirect* paksa ke / (Halaman Utama).  
   * Hak istimewa 'admin' ini awalnya di-inject manual via SQL Editor di Dashboard Supabase oleh Developer.  
3. **Inisialisasi Realtime Connection:**  
   * React me-mount komponen *Live Logs Terminal*.  
   * Menggunakan Supabase JS: .channel('custom-all-channel').on('postgres\_changes', ...) untuk melakukan *subscribe* ke setiap aktivitas (INSERT/UPDATE) pada tabel harvest\_reports atau transactions.  
4. **Rendering Data Stream:** Terminal meng-*append* log masuk ke *array state* React dan melakukan *auto-scroll* ke elemen terbawah (*brutalist terminal style* huruf hijau latar hitam).  
5. **Action "Ban User":**  
   * Admin memencet tombol "Ban User" pada *Row* data di tabel.  
   * Frontend menembak query UPDATE users SET status\_active \= false WHERE id \= \[user\_id\].  
   * Akses *user* terputus karena Row Level Security (RLS) PostgreSQL akan memblokir semua interaksi dari status\_active \= false.

# **4\. Spesifikasi Payload / Interaksi Data**

**Payload Supabase Realtime (CDC \- Change Data Capture) di Frontend:**

{  
  "type": "INSERT",  
  "table": "harvest\_reports",  
  "schema": "public",  
  "record": {  
    "id": "uuid-999",  
    "user\_id": "uuid-123",  
    "commodity\_name": "Padi",  
    "weight\_kg": 1000  
  },  
  "old\_record": null  
}

# **5\. Skema Target Database & Mutasi Data**

**Tabel users (Evolusi Skema untuk Support Admin/Ban):**

* id (UUID, Primary Key)  
* role (ENUM: 'farmer', 'distributor', 'admin') \-\> *Default 'farmer'*  
* status\_active (BOOLEAN) \-\> *Default TRUE*

**Mutasi SQL saat tombol Ban ditekan:**

UPDATE users   
SET status\_active \= false,   
    updated\_at \= NOW()   
WHERE id \= 'target-uuid-here';

**PostgreSQL RLS (Row Level Security) Policy Setup:**

\-- Dijalankan sekali di setup database untuk proteksi sistem  
CREATE POLICY "Banned users cannot read/write"   
ON public.harvest\_reports   
FOR ALL   
USING (  
  (SELECT status\_active FROM users WHERE users.id \= auth.uid()) \= true  
);

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: Terminal Log Meledak Menyebabkan Memori Browser Penuh.** (Jika terjadi 10,000 *event* dalam 1 menit).  
  * *Penanganan:* React *State Array* yang menampung log dibatasi maksimum length \= 200\. Jika ada log baru masuk, indeks ke-0 dihapus (shift()).  
* **Edge Case 2: Web Socket Putus (Koneksi Admin Tidak Stabil).**  
  * *Penanganan:* Supabase Client mendeteksi status *Channel*. Pasang UI Indikator (lingkaran di ujung layar): Hijau (Connected), Merah (Disconnected). Frontend otomatis melakukan *re-connect* dalam interval 5 detik.  
* **Edge Case 3: Admin Salah Pencet / "Self-Ban".**  
  * *Penanganan:* UI secara *hard-coded* mendisable tombol *Ban* (menjadi warna abu-abu / *disabled*) apabila row.user\_id \=== current\_admin\_id.