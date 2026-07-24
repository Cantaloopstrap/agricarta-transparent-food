"""
==============================================================================
AgriCarta ML Engine - Google Colab Training Notebook Script (PyTorch & Keras)
Model: LSTM (Long Short-Term Memory) 14-Day Lookback -> 7-Day Forecast
==============================================================================
"""

try:
    from google.colab import drive
    import os
    drive.mount('/content/drive')
    DRIVE_WORKSPACE_PATH = '/content/drive/MyDrive/AgriCarta_ML'
    os.makedirs(DRIVE_WORKSPACE_PATH, exist_ok=True)
    print(f"[Colab] Google Drive mounted di: {DRIVE_WORKSPACE_PATH}")
except ImportError:
    DRIVE_WORKSPACE_PATH = "."
    print("[Local] Running outside Google Colab.")

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib
from sklearn.preprocessing import MinMaxScaler
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

np.random.seed(42)
torch.manual_seed(42)

def load_and_preprocess_data(csv_path: str, commodity_name: str = "Beras"):
    print(f"Membaca dataset dari: {csv_path}")
    df = pd.read_csv(csv_path)
    df['Tanggal'] = pd.to_datetime(df['Tanggal'])
    df = df.sort_values('Tanggal').reset_index(drop=True)
    df_comm = df[df['Nama Komoditas'].str.lower() == commodity_name.lower()].copy()
    if df_comm.empty:
        df_comm = df.copy()
    df_comm.set_index('Tanggal', inplace=True)
    scaler = MinMaxScaler(feature_range=(0, 1))
    prices = df_comm[['Harga Aktual']].values
    scaled_prices = scaler.fit_transform(prices)
    return df_comm, scaled_prices, scaler

def create_sliding_window(data: np.ndarray, input_window: int = 14, output_window: int = 7):
    X, y = [], []
    for i in range(len(data) - input_window - output_window + 1):
        feature_seq = data[i : i + input_window]
        target_seq = data[i + input_window : i + input_window + output_window]
        X.append(feature_seq)
        y.append(target_seq.flatten())
    return np.array(X), np.array(y)

class AgriCartaLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=7):
        super(AgriCartaLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_out = lstm_out[:, -1, :]
        out = self.fc(last_out)
        return out

def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    epsilon = 1e-8
    return float(np.mean(np.abs((y_true - y_pred) / (y_true + epsilon))) * 100)

if __name__ == "__main__":
    csv_file = f"{DRIVE_WORKSPACE_PATH}/dataset_harga_agrikarta.csv"
    if not os.path.exists(csv_file):
        csv_file = "dataset_harga_agrikarta.csv"

    df_pangan, scaled_data, price_scaler = load_and_preprocess_data(csv_file, commodity_name="Beras")
    X_samples, y_samples = create_sliding_window(scaled_data, input_window=14, output_window=7)

    train_size = int(len(X_samples) * 0.8)
    X_train, X_val = X_samples[:train_size], X_samples[train_size:]
    y_train, y_val = y_samples[:train_size], y_samples[train_size:]

    X_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.float32)
    X_val_t = torch.tensor(X_val, dtype=torch.float32)

    model = AgriCartaLSTM(input_size=1, hidden_size=32, num_layers=1, output_size=7)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)

    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)

    model.train()
    for epoch in range(1, 101):
        epoch_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * batch_x.size(0)

    model.eval()
    with torch.no_grad():
        val_preds_scaled = model(X_val_t).numpy()

    y_val_unscaled = price_scaler.inverse_transform(y_val)
    val_preds_unscaled = price_scaler.inverse_transform(val_preds_scaled)

    mape_score = calculate_mape(y_val_unscaled, val_preds_unscaled)
    print(f"MAPE: {mape_score:.2f}% | Akurasi: {max(0, 100 - mape_score):.2f}%")

    MODEL_PATH = f"{DRIVE_WORKSPACE_PATH}/agrikarta_lstm_model.pt"
    SCALER_PATH = f"{DRIVE_WORKSPACE_PATH}/price_scaler.pkl"
    torch.save(model.state_dict(), MODEL_PATH)
    joblib.dump(price_scaler, SCALER_PATH)
    print("Export Complete!")
