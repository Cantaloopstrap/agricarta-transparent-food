# **1\. Judul & Ringkasan Fitur**

**Fitur:** Sinkronisasi Google Form (Persona)

**Ringkasan:** Automasi penerimaan data penilaian persona distributor (Kualitas, Disiplin, Sikap, Kejujuran) dari pengisian Google Form, diproses untuk mendapatkan skor agregat, dan disimpan ke dalam database secara *real-time* via Webhook Supabase Edge Functions.

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Dideploy di Supabase Edge Functions (Deno/TypeScript) ATAU Repo 2 (Node.js API Express).  
* **Tech Stack:** Google Apps Script (GAS) untuk *trigger* POST, Supabase Edge Functions / Node.js.

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **Pengisian Form:** User (Evaluator) men-submit Google Form.  
2. **Trigger GAS:** Script *onFormSubmit* di Google Apps Script terpicu. Script menyusun jawaban ke dalam format JSON.  
3. **Webhook HTTP POST:** GAS menembak endpoint HTTP POST Supabase Edge Function https://\[project\_ref\].supabase.co/functions/v1/persona-sync beserta API Key (Auth Header).  
4. **Data Ingestion & Kalkulasi:**  
   * Edge Function memvalidasi Auth/Secret Key dari GAS.  
   * Sistem menerima parameter JSON.  
   * Sistem menghitung avg\_score \= (Kualitas \+ Disiplin \+ Sikap \+ Kejujuran) / 4\.  
5. **Database Update:**  
   * Edge Function menjalankan query UPSERT ke tabel distributors menggunakan nomor HP atau Email sebagai *Identifier* (Conflict Target).  
   * Data *rating* persona distributor berhasil di-update.

# **4\. Spesifikasi Payload / Interaksi Data**

**Request dari Google Apps Script ke Webhook:**

POST /functions/v1/persona-sync  
Authorization: Bearer \<WEBHOOK\_SECRET\_KEY\>  
Content-Type: application/json

{  
  "timestamp": "2026-07-23T10:00:00Z",  
  "distributor\_phone": "628123456789",  
  "distributor\_name": "PT. Agro Sukses",  
  "scores": {  
    "kualitas": 80,  
    "disiplin": 90,  
    "sikap": 75,  
    "kejujuran": 85  
  }  
}

# **5\. Skema Target Database & Mutasi Data**

**Tabel distributors (UPSERT):**

* id (UUID, Primary Key)  
* phone (VARCHAR, Unique constraint)  
* name (VARCHAR)  
* score\_kualitas (NUMERIC)  
* score\_disiplin (NUMERIC)  
* score\_sikap (NUMERIC)  
* score\_kejujuran (NUMERIC)  
* avg\_score (NUMERIC) \- *Di-calculate dari Edge Function*  
* updated\_at (TIMESTAMPTZ)

**Mutasi SQL Equivalen:**

INSERT INTO distributors (phone, name, score\_kualitas, score\_disiplin, score\_sikap, score\_kejujuran, avg\_score, updated\_at)  
VALUES ('628123456789', 'PT. Agro Sukses', 80, 90, 75, 85, 82.5, NOW())  
ON CONFLICT (phone) DO UPDATE   
SET score\_kualitas \= EXCLUDED.score\_kualitas,  
    avg\_score \= EXCLUDED.avg\_score,  
    updated\_at \= NOW();

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: Tipe Data Form Tidak Valid.** (Misal: User mengisi "Delapan Puluh" alih-alih "80").  
  * *Penanganan:* Google Form di-set dengan *Data Validation* (Hanya Angka). Edge Function juga harus melakukan parseInt() dengan fallback if(isNaN) throw Error.  
* **Edge Case 2: Endpoint Webhook Terekspos (Security).**  
  * *Penanganan:* Webhook wajib dicek menggunakan *Authorization Bearer Token* statis (Secret Key) yang hanya diketahui oleh GAS dan Edge Function.  
* **Edge Case 3: Google Script Timeout.**  
  * *Penanganan:* Edge Function harus merespons kode 200 OK secepatnya sebelum melakukan UPDATE database (pola *Asynchronous processing*), atau memastikan proses DB terjadi di bawah 1 detik.