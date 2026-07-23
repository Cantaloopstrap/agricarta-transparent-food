import os
import logging
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import datetime
from db_client import get_supabase_client
from scraper import scrape_sp2kp_data, DEFAULT_COMMODITIES
from predictor import run_lstm_prediction

# Configure standard Python logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ml_engine")

app = FastAPI(
    title="Agrikarta ML Engine & Price Predictor",
    description="Python microservice for SP2KP web scraping and PyTorch LSTM 7-Day Price Predictions",
    version="1.0.0"
)

# Production CORS Security Hardening
frontend_url = os.getenv("FRONTEND_URL", "https://agrikarta.app")
allowed_origins = [
    frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def run_scheduled_tasks():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    logger.info("Cron: Executing daily SP2KP web scraping...")
    loop.run_until_complete(scrape_sp2kp_data())
    
    logger.info("Cron: Executing daily PyTorch LSTM predictions...")
    for comm in DEFAULT_COMMODITIES:
        loop.run_until_complete(run_lstm_prediction(comm["id"]))
        
    loop.close()

scheduler = BackgroundScheduler()

@app.on_event("startup")
async def startup_event():
    logger.info("Agrikarta ML Engine FastAPI service starting up on port 8000...")
    # Schedule daily jobs: Scraper at 23:00, LSTM predictions at 23:30
    scheduler.add_job(run_scheduled_tasks, trigger='cron', hour=23, minute=0, id="daily_sp2kp_scrape_and_ml")
    scheduler.start()
    
    # Run initial bootstrap check on startup asynchronously
    asyncio.create_task(initial_bootstrap())

async def initial_bootstrap():
    supabase = get_supabase_client()
    if supabase:
        try:
            res = supabase.table("daily_prices").select("date").limit(1).execute()
            if not res.data:
                logger.info("Empty database detected on boot. Seeding initial daily prices and running LSTM predictions...")
                await scrape_sp2kp_data()
                for comm in DEFAULT_COMMODITIES:
                    await run_lstm_prediction(comm["id"])
        except Exception as e:
            logger.warning(f"Boot check notice: {e}")

@app.get("/")
def read_root():
    return {
        "service": "Agrikarta ML Engine & Price Predictor",
        "status": "online",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}

@app.get("/api/prices/predictions")
async def get_price_predictions(commodity: str = Query("jagung", description="Commodity ID or name")):
    c_id = commodity.lower().strip()
    c_name = c_id.capitalize()
    
    for item in DEFAULT_COMMODITIES:
        if item["id"] == c_id or item["name"].lower() == c_id:
            c_id = item["id"]
            c_name = item["name"]
            break

    supabase = get_supabase_client()
    
    historical_list = []
    prediction_list = []
    
    if supabase:
        try:
            # Query last 30 days of historical actual prices
            hist_res = supabase.table("daily_prices") \
                .select("date, actual_price") \
                .eq("commodity_id", c_id) \
                .order("date", desc=True) \
                .limit(30) \
                .execute()
                
            if hist_res.data:
                historical_data = list(reversed(hist_res.data))
                historical_list = [
                    {
                        "date": row["date"],
                        "price": float(row["actual_price"])
                    }
                    for row in historical_data
                ]

            # Query 7 predicted days (H+1 to H+7)
            pred_res = supabase.table("price_predictions") \
                .select("target_date, predicted_price, confidence_low, confidence_high") \
                .eq("commodity_id", c_id) \
                .order("target_date", desc=False) \
                .limit(7) \
                .execute()
                
            if pred_res.data:
                prediction_list = [
                    {
                        "date": row["target_date"],
                        "predicted_price": float(row["predicted_price"]),
                        "lower_bound": float(row["confidence_low"]),
                        "upper_bound": float(row["confidence_high"])
                    }
                    for row in pred_res.data
                ]
        except Exception as e:
            logger.error(f"Error querying price data from Supabase: {e}")
            
    # If no data found, generate baseline data on demand
    if not historical_list or not prediction_list:
        logger.info(f"Generating on-demand predictions for '{c_id}'...")
        await run_lstm_prediction(c_id)
        
        if supabase:
            hist_res = supabase.table("daily_prices").select("date, actual_price").eq("commodity_id", c_id).order("date", desc=True).limit(30).execute()
            pred_res = supabase.table("price_predictions").select("target_date, predicted_price, confidence_low, confidence_high").eq("commodity_id", c_id).order("target_date", desc=False).limit(7).execute()
            
            if hist_res.data:
                historical_list = [{"date": r["date"], "price": float(r["actual_price"])} for r in reversed(hist_res.data)]
            if pred_res.data:
                prediction_list = [{
                    "date": r["target_date"],
                    "predicted_price": float(r["predicted_price"]),
                    "lower_bound": float(r["confidence_low"]),
                    "upper_bound": float(r["confidence_high"])
                } for r in pred_res.data]

    return {
        "commodity": c_name,
        "historical": historical_list,
        "prediction": prediction_list
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
