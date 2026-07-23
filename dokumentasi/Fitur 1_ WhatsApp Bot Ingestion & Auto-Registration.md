# **1\. Judul & Ringkasan Fitur**

**Fitur:** WhatsApp Bot Ingestion & Auto-Registration

**Ringkasan:** Sistem penerimaan laporan panen secara *crowdsourced* dari petani melalui WhatsApp. Bot memiliki kemampuan mendeteksi nomor yang belum terdaftar untuk auto-registrasi, mengekstrak data panen (komoditas dan bobot) menggunakan Regex, dan mengumpulkan bukti foto yang langsung diunggah ke *cloud storage*.

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Repo 2 (Node.js Bot & Webhooks)  
* **Tech Stack:** Node.js, @whiskeysockets/baileys (WA Socket), Regex Engine, Supabase JS Client (Database & Storage).

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **Penerimaan Pesan:** baileys mendeteksi pesan teks masuk (On Message Upsert).  
2. **Validasi User (Gatekeeper):**  
   * Bot mengekstrak ID pengirim (nomor telepon).  
   * Bot melakukan query: SELECT id, name FROM users WHERE phone \= \[nomor\].  
   * **Jika NULL:** Masuk ke *Registration State*. Bot membalas: *"Halo\! Anda belum terdaftar. Balas dengan NAMA\_LENGKAP"*. Sesi state disimpan di memori/Redis sementara.  
   * **Jika Ada (Registered):** Lanjut ke langkah 3\.  
3. **Ekstraksi Data Panen:**  
   * Bot menjalankan Regex /(?\<komoditas\>\[a-zA-Z\]+)\\s\*(?\<bobot\>\\d+)\\s\*kg/i pada teks pesan.  
   * Jika tidak *match*, abaikan atau balas dengan format yang benar.  
   * Jika *match*, ekstrak komoditas dan bobot.  
4. **Permintaan & Upload Foto:**  
   * Bot meminta: *"Kirimkan foto timbangan untuk \[komoditas\]"*.  
   * State user dipindah ke *Waiting for Photo*.  
   * Saat foto diterima, Node.js mengonversi *buffer* gambar dan melakukan POST ke Supabase Storage (/harvest\_images).  
5. **Persistensi Data:**  
   * Mendapatkan public URL foto dari Storage.  
   * Melakukan INSERT ke tabel harvest\_reports.  
   * Bot membalas: *"Laporan berhasil dicatat\!"*

# **4\. Spesifikasi Payload / Interaksi Data**

**Contoh Ekstraksi Regex (Internal Node.js):**

{  
  "raw\_message": "Jagung 500 kg",  
  "regex\_groups": {  
    "komoditas": "Jagung",  
    "bobot": "500"  
  }  
}

**Payload Supabase Insert (harvest\_reports):**

{  
  "user\_id": "uuid-1234-5678",  
  "commodity\_name": "Jagung",  
  "weight\_kg": 500,  
  "proof\_image\_url": "https://\[project\_ref\].supabase.co/storage/v1/object/public/harvest\_images/jagung\_123.jpg"  
}

# **5\. Skema Target Database & Mutasi Data**

**Tabel users (INSERT saat auto-registrasi):**

* id (UUID, Primary Key)  
* phone (VARCHAR, Unique)  
* full\_name (VARCHAR)  
* created\_at (TIMESTAMPTZ)

**Tabel harvest\_reports (INSERT saat lapor panen):**

* id (UUID, Primary Key)  
* user\_id (UUID, Foreign Key ke users.id)  
* commodity\_name (VARCHAR)  
* weight\_kg (NUMERIC)  
* proof\_image\_url (TEXT)  
* created\_at (TIMESTAMPTZ)

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: Regex Gagal Menganalisa Typo.** (Misal: "JAgng 50kg").  
  * *Penanganan:* Implementasi *fuzzy matching* opsional jika regex dasar gagal, atau bot secara eksplisit memberikan panduan format (contoh: "Format salah. Ketik: \[Nama Komoditas\] \[Angka\] kg").  
* **Edge Case 2: Supabase Storage Down/Gagal Upload.**  
  * *Penanganan:* Tangkap exception dari Supabase. Beri pesan *fallback* ke user: *"Sistem sedang sibuk. Simpan foto Anda dan laporkan kembali dalam 10 menit."*  
* **Edge Case 3: Race Condition Registrasi.**  
  * *Penanganan:* Gunakan *Upsert* ON CONFLICT (phone) DO NOTHING di PostgreSQL agar tidak terjadi duplikasi user jika user mengirim pesan bertubi-tubi saat belum terdaftar.