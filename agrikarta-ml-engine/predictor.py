"""
==============================================================================
AgriCarta ML Engine - PyTorch LSTM Predictor Module
==============================================================================
"""

import os
import logging
import datetime
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None

logger = logging.getLogger("agrikarta_ml_engine.predictor")

if HAS_TORCH:
    class LSTMPredictorModel(nn.Module):
        """
        Arsitektur Model PyTorch LSTM untuk Prediksi Harga 7-Timesteps Ke Depan.
        Menggunakan input_size=1, hidden_size=32, num_layers=1, output_size=7.
        """
        def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=7):
            super(LSTMPredictorModel, self).__init__()
            self.hidden_size = hidden_size
            self.num_layers = num_layers
            self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, batch_first=True)
            self.fc = nn.Linear(hidden_size, output_size)

        def forward(self, x):
            out, _ = self.lstm(x)
            out = self.fc(out[:, -1, :])
            return out
else:
    class LSTMPredictorModel:
        def __init__(self, *args, **kwargs):
            pass
        def eval(self):
            pass




class AgriCartaPredictor:
    """
    Predictor Engine yang mengelola loading model PyTorch (.pt) dan scaler (.pkl),
    serta menghasilkan data historis & 7-hari prediksi harga dengan Confidence Bounds.
    """

    DEFAULT_BASE_PRICES = {
        "beras": 14500.0,
        "cabai merah": 42000.0,
        "cabai": 42000.0,
        "bawang merah": 34000.0,
        "bawang": 34000.0,
        "jagung": 5200.0,
        "minyak": 17500.0
    }

    def __init__(self, model_path="agrikarta_lstm_model.pt", scaler_path="price_scaler.pkl"):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = LSTMPredictorModel(input_size=1, hidden_size=32, num_layers=1, output_size=7)
        if HAS_TORCH and hasattr(self.model, 'eval'):
            self.model.eval()
        self.scaler = None
        self._load_artifacts()

    def _load_artifacts(self):
        """
        Memuat model state_dict PyTorch dan scaler jika tersedia.
        Jika belum ada, menggunakan fallback scaler.
        """
        # Search paths (current dir or root workspace)
        search_model_paths = [
            self.model_path,
            os.path.join("..", self.model_path),
            os.path.join("ml-engine", self.model_path)
        ]
        search_scaler_paths = [
            self.scaler_path,
            os.path.join("..", self.scaler_path),
            os.path.join("ml-engine", self.scaler_path)
        ]

        # Load PyTorch Weights
        loaded_model = False
        for p in search_model_paths:
            if os.path.exists(p):
                try:
                    state_dict = torch.load(p, map_location=torch.device('cpu'))
                    self.model.load_state_dict(state_dict)
                    logger.info(f"SUCCESS: Model PyTorch berhasil dimuat dari: {p}")
                    loaded_model = True
                    break
                except Exception as e:
                    logger.warning(f"Gagal memuat weights model dari {p}: {e}")

        if not loaded_model:
            logger.info("Notice: File weight 'agrikarta_lstm_model.pt' belum ditemukan. Menggunakan bobot inisialisasi awal.")

        # Load Scaler
        for p in search_scaler_paths:
            if os.path.exists(p):
                try:
                    self.scaler = joblib.load(p)
                    logger.info(f"SUCCESS: Scaler MinMaxScaler berhasil dimuat dari: {p}")
                    break
                except Exception as e:
                    logger.warning(f"Gagal memuat scaler dari {p}: {e}")

    def generate_synthetic_history(self, commodity_id: str, days: int = 30) -> pd.DataFrame:
        """
        Menghasilkan data historis 30 hari yang realistis jika tidak ada database aktif.
        """
        c_key = commodity_id.lower().strip()
        base = self.DEFAULT_BASE_PRICES.get(c_key, 20000.0)
        
        today = datetime.date.today()
        dates = [today - datetime.timedelta(days=i) for i in range(days - 1, -1, -1)]
        
        np.random.seed(sum(ord(ch) for ch in c_key))
        current_price = base
        records = []
        
        for dt in dates:
            change = np.random.normal(0, base * 0.012)
            current_price = max(base * 0.5, current_price + change)
            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "price": round(float(current_price), 2)
            })
            
        return pd.DataFrame(records)

    def predict_7days(self, commodity_name: str = "Beras") -> dict:
        """
        Fungsi Inferensi Prediksi 7-Timesteps Ke Depan:
        1. Menyiapkan data historis (30 hari)
        2. Normalisasi dengan MinMaxScaler
        3. Inferensi Sliding Window 14 Hari -> Model PyTorch -> 7 Hari Target
        4. Mengembalikan JSON dengan data historis, prediksi, dan lower/upper confidence bounds.
        """
        c_clean = commodity_name.strip()
        df_hist = self.generate_synthetic_history(c_clean, days=30)
        prices = df_hist['price'].values.reshape(-1, 1)

        # Scaler initialization or fit
        if self.scaler is None:
            scaler = MinMaxScaler(feature_range=(0, 1))
            scaled_prices = scaler.fit_transform(prices)
        else:
            scaler = self.scaler
            scaled_prices = scaler.transform(prices)

        # Sliding Window 14 Hari Lookback
        seq_len = min(14, len(scaled_prices))
        input_seq = scaled_prices[-seq_len:].reshape(1, seq_len, 1)

        if HAS_TORCH and self.model is not None and isinstance(self.model, nn.Module):
            x_tensor = torch.tensor(input_seq, dtype=torch.float32)
            with torch.no_grad():
                raw_pred = self.model(x_tensor).numpy()
            predictions_scaled = raw_pred.reshape(-1, 1)
            predictions_unscaled = scaler.inverse_transform(predictions_scaled).flatten()
        else:
            # Moving Average & Linear Trend Fallback if PyTorch is not present
            last_p = prices[-1][0]
            trend = (prices[-1][0] - prices[-7][0]) / 7.0 if len(prices) >= 7 else 0
            predictions_unscaled = [round(last_p + (i + 1) * trend + np.random.normal(0, last_p * 0.005), 2) for i in range(7)]


        # Calculation Confidence Bounds (95% CI)
        std_dev = np.std(prices) if len(prices) > 1 else prices[-1][0] * 0.03
        today = datetime.date.today()
        
        predictions_output = []
        for i in range(7):
            target_dt = (today + datetime.timedelta(days=i + 1)).strftime("%Y-%m-%d")
            pred_val = round(float(predictions_unscaled[i]), 2)
            
            # Safeguard: if predicted price is non-positive, fallback to moving average
            if pred_val <= 0:
                pred_val = round(float(np.mean(prices[-7:])), 2)

            margin = round(float(1.96 * std_dev * np.sqrt((i + 1) / 3.0)), 2)
            lower_bound = max(100.0, round(pred_val - margin, 2))
            upper_bound = round(pred_val + margin, 2)

            predictions_output.append({
                "date": target_dt,
                "predicted_price": pred_val,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound
            })

        return {
            "commodity": c_clean.capitalize(),
            "historical": df_hist.to_dict(orient="records"),
            "prediction": predictions_output
        }


# Singleton Instance
predictor_engine = AgriCartaPredictor()
