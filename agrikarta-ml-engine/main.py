"""
==============================================================================
AgriCarta ML Engine - FastAPI Server
Endpoint: GET /api/prices/predictions
==============================================================================
"""

import os
import datetime
import logging
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from predictor import predictor_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agrikarta_ml_engine")

app = FastAPI(
    title="AgriCarta ML Engine Microservice",
    description="Python FastAPI Microservice untuk PyTorch LSTM 7-Day Food Price Prediction",
    version="1.0.0"
)

# Production CORS Hardening
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [
    frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "AgriCarta ML Engine Microservice",
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat()
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}


@app.get("/api/prices/predictions")
async def get_price_predictions(commodity: str = Query("beras", description="Nama komoditas (misal: Beras, Cabai Merah, Bawang Merah)")):
    """
    Endpoint utama untuk mengambil data historis dan prediksi harga 7 hari ke depan
    beserta Confidence Interval (lower_bound & upper_bound).
    """
    logger.info(f"Received prediction request for commodity: '{commodity}'")
    result = predictor_engine.predict_7days(commodity_name=commodity)
    return result


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AgriCarta ML Engine FastAPI server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
