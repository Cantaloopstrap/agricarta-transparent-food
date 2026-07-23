# **1\. Judul & Ringkasan Fitur**

**Fitur:** Machine Learning Price Prediction (Prediksi H+7)

**Ringkasan:** Fitur analitik prediktif yang menarik data historis harian SP2KP menggunakan Scraper, menyimpannya di TimescaleDB (Supabase), dan menjalankan model LSTM (Deep Learning) untuk memproyeksikan harga komoditas hingga 7 hari ke depan beserta rentang interval keyakinan (*Confidence Interval*).

# **2\. Repositori & Tech Stack Target**

* **Target Repositori:** Repo 3 (Data Scraper & ML Engine)  
* **Tech Stack:** Python (Flask/FastAPI), Celery/Cron, Scrapy/BeautifulSoup, PyTorch/TensorFlow, psycopg2 (Koneksi PostgreSQL/TimescaleDB).

# **3\. Alur Eksekusi Sistem (Step-by-step Logic)**

1. **Cronjob Scraper (23:00):** Python script (Scrapy) berjalan setiap malam untuk menarik tabel HTML harian dari situs SP2KP Kemendag.  
2. **Data Cleansing & Ingestion:** Data di-*parse*, diformat, dan disimpan ke tabel daily\_prices di Supabase. *Fail-safe Forward Fill* aktif jika gagal scrape (ambil harga H-1).  
3. **ML Inference Trigger (23:30):**  
   * Model LSTM mengambil data *time-series* historis dari TimescaleDB.  
   * Model melakukan normalisasi (MinMaxScaler).  
   * Inference dieksekusi untuk *output* 7 *timesteps* ke depan.  
   * Model menghitung variansi untuk *Upper* dan *Lower Bounds* (Confidence Interval).  
4. **Menyimpan Proyeksi:** Hasil H+1 hingga H+7 di-insert/replace ke tabel price\_predictions.  
5. **Presentasi UI:** React PWA me-request data via Supabase API (GET) dan merendernya dalam grafik Recharts menggunakan dua series: Aktual vs Prediksi.

# **4\. Spesifikasi Payload / Interaksi Data**

**Format API Response (GET /api/prices/predictions?commodity=jagung):**

{  
  "commodity": "Jagung",  
  "historical": \[  
    { "date": "2026-07-22", "price": 5000 },  
    { "date": "2026-07-23", "price": 5100 }  
  \],  
  "prediction": \[  
    {   
      "date": "2026-07-24",   
      "predicted\_price": 5150,   
      "lower\_bound": 5000,   
      "upper\_bound": 5300   
    },  
    { "date": "2026-07-25", "predicted\_price": 5200, "lower\_bound": 5020, "upper\_bound": 5380 }  
  \]  
}

# **5\. Skema Target Database & Mutasi Data**

**Tabel daily\_prices (Time-series / TimescaleDB hypertable):**

* date (DATE, Primary Key part 1\)  
* commodity\_id (INT, Primary Key part 2\)  
* actual\_price (NUMERIC)

**Tabel price\_predictions (TRUNCATE & INSERT setiap malam):**

* target\_date (DATE)  
* commodity\_id (INT)  
* predicted\_price (NUMERIC)  
* confidence\_low (NUMERIC)  
* confidence\_high (NUMERIC)  
* computed\_at (TIMESTAMPTZ)

# **6\. Edge Cases & Penanganan Error**

* **Edge Case 1: Target Web Scraper (SP2KP) Down / Maintenance / Berubah Struktur DOM.**  
  * *Penanganan:* Exception tertangkap di *BeautifulSoup*. Trigger sistem mitigasi: **Forward Fill Algorithm** (meng-copy actual\_price hari kemarin untuk hari ini). Kirim notifikasi log peringatan ke tabel Admin Logs.  
* **Edge Case 2: ML Model Gagal Konvergen / Menghasilkan Prediksi Negatif/Anomali.**  
  * *Penanganan:* Validasi output post-inference. Jika predicted\_price \< 0 atau \> 200% dari harga aktual, fallback ke metode statistik klasik (*Moving Average* 7 hari terakhir) sebagai *safeguard*.  
* **Edge Case 3: Kinerja Query Berat di React.**  
  * *Penanganan:* Backend hanya mereturn data 30 hari ke belakang \+ 7 hari ke depan via *Materialized Views* di PostgreSQL, mencegah transfer payload terlalu besar ke browser.