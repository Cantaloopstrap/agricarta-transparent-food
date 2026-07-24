# 🌾 AgriCarta ML Engine Microservice

**AgriCarta ML Engine** adalah layanan mikro (microservice) backend berbasis Python dan FastAPI yang menyediakan inferensi prediksi harga pangan 7 hari ke depan menggunakan model Machine Learning **PyTorch LSTM (Long Short-Term Memory)** beserta *Confidence Bounds (95% CI)*.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **Machine Learning**: [PyTorch](https://pytorch.org/) (LSTM) & [Scikit-learn](https://scikit-learn.org/) (MinMaxScaler)
- **Data Manipulation**: [Pandas](https://pandas.pydata.org/) & [NumPy](https://numpy.org/)
- **Artifact Serialization**: [Joblib](https://joblib.readthedocs.io/)

---

## 📋 Prerequisites

Sebelum menjalankan service ini, pastikan sistem Anda telah memiliki:
- **Python 3.9+** (Rekomendasi Python 3.10 / 3.11 / 3.13)
- **pip** (Package Installer for Python)

---

## ⚙️ Setup & Instalasi Lokal

1. **Masuk ke direktori repositori:**
   ```bash
   cd agrikarta-ml-engine
   ```

2. **Buat Virtual Environment (disarankan):**
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. **Install seluruh dependensi:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Persiapan Model & Scaler Artifacts:**
   Pastikan file hasil pelatihan dari Google Colab berada dalam direktori:
   - `agrikarta_lstm_model.pt` (PyTorch state_dict)
   - `price_scaler.pkl` (MinMaxScaler joblib object)

   *(Catatan: Jika file belum ada, ML Engine menyediakan fallback automatic simulation scaler untuk kemudahan testing)*.

---

## 🚀 Menjalankan Server API

Jalankan perintah berikut untuk mengaktifkan server FastAPI:

```bash
python main.py
```

Atau menggunakan perintah Uvicorn langsung dengan hot-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Base URL Server:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 🔌 API Endpoint

### `GET /api/prices/predictions`

Mengembalikan data deret waktu historis 30 hari dan hasil inferensi prediksi 7 hari ke depan untuk komoditas pilihan.

**Query Parameters:**
- `commodity` (string, opsional): Nama komoditas target (`beras`, `cabai merah`, `bawang merah`, `jagung`, `minyak`). Default: `beras`.

**Contoh Request:**
```bash
curl -X GET "http://localhost:8000/api/prices/predictions?commodity=beras"
```

**Contoh Respons JSON:**
```json
{
  "commodity": "Beras",
  "historical": [
    { "date": "2026-06-25", "price": 14500.0 },
    { "date": "2026-06-26", "price": 14600.0 }
  ],
  "prediction": [
    {
      "date": "2026-07-25",
      "predicted_price": 17011.77,
      "lower_bound": 16172.43,
      "upper_bound": 17851.11
    }
  ]
}
```
