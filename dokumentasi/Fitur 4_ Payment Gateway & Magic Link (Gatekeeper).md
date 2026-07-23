# **1\. Judul & Ringkasan Fitur**

**Fitur:** Payment Gateway & Magic Link (Gatekeeper)

**Ringkasan:** Alur monetisasi premium (*paywall*) di mana *user* menginput nomor WA, membayar via Midtrans Snap, lalu mendapatkan token *Magic Link* yang dikirimkan langsung ke WhatsApp mereka oleh bot untuk membuka kunci akses premium di React PWA tanpa memerlukan sistem *password* tradisional.

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Kombinasi Repo 1 (PWA Frontend) dan Repo 2 (Node.js API & WA Bot).  
* **Tech Stack:** React (Frontend UI), Midtrans Node.js SDK, jsonwebtoken (JWT), @whiskeysockets/baileys (WA Sender), Supabase Auth/DB.

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **User Initiation:** User klik "Beli Premium" di PWA. Memasukkan Nomor WA di modal. React menembak POST ke /api/checkout.  
2. **Transaction Creation:** Node.js membuat *Order ID* di DB transactions (status pending) dan me-request URL Midtrans Snap.  
3. **Pembayaran:** Midtrans Snap muncul di frontend, user menyelesaikan pembayaran (misal via QRIS).  
4. **Webhook Konfirmasi:** Server Midtrans menembak Webhook POST ke Node.js /api/midtrans-webhook menginformasikan pembayaran settlement.  
5. **Magic Link Generation:**  
   * Node.js mengubah status transaksi di DB menjadi paid.  
   * Node.js meng-update users.is\_premium \= true.  
   * Node.js men-generate JWT Token dengan *payload* { phone: '628...', tier: 'premium' }.  
6. **Delivery via WhatsApp:** Node.js/Baileys mengirim pesan WA ke user: *"Pembayaran sukses\! Klik link ini untuk masuk: https://agrikarta.app/auth?token=eyJhb..."*.  
7. **Frontend Authentication:** User klik link, PWA membaca *query parameter* ?token=, memvalidasinya via Backend, dan menyimpan state is\_premium: true di LocalStorage/Zustand.

# **4\. Spesifikasi Payload / Interaksi Data**

**Payload Webhook dari Midtrans ke Node.js (Simulasi):**

{  
  "transaction\_id": "93c6a0c2-...",  
  "order\_id": "PREMIUM-628123456789-1690001000",  
  "gross\_amount": "50000.00",  
  "transaction\_status": "settlement",  
  "payment\_type": "qris"  
}

**Payload JWT Payload (*Decoded*):**

{  
  "phone": "628123456789",  
  "role": "farmer",  
  "premium\_until": 1721780000,  
  "iat": 1690001000,  
  "exp": 1690004600   
}

*(Catatan: Token Magic Link sebaiknya hanya berlaku 1 jam exp untuk claim).*

# **5\. Skema Target Database & Mutasi Data**

**Tabel transactions:**

* order\_id (VARCHAR, Primary Key)  
* phone (VARCHAR)  
* amount (NUMERIC)  
* status (ENUM: 'pending', 'settlement', 'expire')  
* created\_at (TIMESTAMPTZ)

**Tabel users (UPDATE):**

* is\_premium (BOOLEAN, set to true)  
* premium\_until (TIMESTAMPTZ, NOW() \+ INTERVAL '1 month')

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: User Menulis Nomor WA yang Salah/Tidak Aktif.**  
  * *Penanganan:* Sebelum membuat transaksi Midtrans, sistem mengecek *registration state* via Baileys *onWhatsApp()* API untuk memastikan nomor valid di jaringan WA.  
* **Edge Case 2: Webhook Midtrans Gagal (Jaringan Down/Timeout).**  
  * *Penanganan:* Frontend PWA menerapkan *polling* GET /api/transaction/:id setiap 5 detik saat modal pembayaran terbuka. Jika Webhook gagal masuk, polling PWA bisa *trigger* backend untuk secara manual mengecek status ke Midtrans API.  
* **Edge Case 3: Token JWT Kedaluwarsa Sebelum Diklik.**  
  * *Penanganan:* Sediakan route /auth/resend-magic-link di mana user menginput ulang nomor WA, backend memverifikasi status premium user, lalu membuat token JWT baru jika mereka memang sudah bayar.