import datetime
import logging
import requests
from bs4 import BeautifulSoup
from db_client import get_supabase_client

logger = logging.getLogger("ml_engine.scraper")

DEFAULT_COMMODITIES = [
    {"id": "jagung", "db_id": 1, "name": "Jagung", "base_price": 5200.0},
    {"id": "cabai", "db_id": 2, "name": "Cabai", "base_price": 38000.0},
    {"id": "padi", "db_id": 3, "name": "Padi", "base_price": 6800.0},
    {"id": "bawang", "db_id": 4, "name": "Bawang", "base_price": 32000.0},
    {"id": "beras", "db_id": 5, "name": "Beras", "base_price": 14500.0},
    {"id": "minyak", "db_id": 6, "name": "Minyak", "base_price": 17500.0}
]

def get_db_commodity_id(comm: str) -> int:
    mapping = {"jagung": 1, "cabai": 2, "padi": 3, "bawang": 4, "beras": 5, "minyak": 6}
    if isinstance(comm, int):
        return comm
    if str(comm).isdigit():
        return int(comm)
    return mapping.get(str(comm).lower().strip(), 1)

async def trigger_forward_fill(today_str: str, commodity_id: str, default_price: float) -> float:
    """
    Forward Fill fail-safe: Replicates previous day's actual price from Supabase.
    If previous day record doesn't exist, falls back to default base price.
    """
    supabase = get_supabase_client()
    db_id = get_db_commodity_id(commodity_id)
    if supabase:
        try:
            yesterday_date = datetime.date.today() - datetime.timedelta(days=1)
            yesterday_str = yesterday_date.isoformat()
            
            response = supabase.table("daily_prices") \
                .select("actual_price") \
                .eq("commodity_id", db_id) \
                .eq("date", yesterday_str) \
                .execute()
                
            if response.data and len(response.data) > 0:
                last_price = float(response.data[0]["actual_price"])
                logger.info(f"Forward-Fill: Replicated yesterday ({yesterday_str}) price of {last_price} for {commodity_id} on {today_str}")
                return last_price
        except Exception as e:
            logger.warning(f"Forward-Fill Warning: Error querying yesterday's price: {e}")
    
    logger.info(f"Forward-Fill Fallback: Using base fallback price {default_price} for {commodity_id} on {today_str}")
    return default_price

async def scrape_sp2kp_data():
    """
    Scrapes daily market prices from SP2KP Kemendag.
    Triggers Forward Fill algorithm if scraping fails or DOM structure changes.
    """
    logger.info("Starting SP2KP daily price scraper...")
    supabase = get_supabase_client()
    today_str = datetime.date.today().isoformat()
    
    scraped_records = []
    sp2kp_url = "https://sp2kp.kemendag.go.id"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(sp2kp_url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        rows = soup.find_all('tr')
        found_commodities = {}
        
        for row in rows:
            text = row.get_text().lower()
            for comm in DEFAULT_COMMODITIES:
                if comm["id"] in text or comm["name"].lower() in text:
                    cols = row.find_all(['td', 'th'])
                    for col in cols:
                        col_text = col.get_text().replace('.', '').replace('rp', '').replace(',', '.').strip()
                        if col_text.isdigit() or (col_text.replace('.', '', 1).isdigit() and float(col_text) > 1000):
                            found_commodities[comm["id"]] = float(col_text)
                            break
                            
        for comm in DEFAULT_COMMODITIES:
            c_id = comm["id"]
            db_id = comm["db_id"]
            if c_id in found_commodities:
                actual_price = found_commodities[c_id]
                logger.info(f"Scraped {comm['name']}: Rp {actual_price}")
            else:
                logger.info(f"Scrape Notice: Could not parse live DOM for {comm['name']}. Triggering Forward Fill...")
                actual_price = await trigger_forward_fill(today_str, c_id, comm["base_price"])
            
            scraped_records.append({
                "date": today_str,
                "commodity_id": db_id,
                "actual_price": actual_price
            })
            
    except Exception as exc:
        logger.warning(f"SP2KP scrape error: {exc}. Executing Forward Fill for all commodities...")
        for comm in DEFAULT_COMMODITIES:
            c_id = comm["id"]
            db_id = comm["db_id"]
            actual_price = await trigger_forward_fill(today_str, c_id, comm["base_price"])
            scraped_records.append({
                "date": today_str,
                "commodity_id": db_id,
                "actual_price": actual_price
            })
            
    # Upsert into daily_prices table
    if supabase and scraped_records:
        try:
            supabase.table("daily_prices").upsert(scraped_records, on_conflict="date,commodity_id").execute()
            logger.info(f"Successfully upserted {len(scraped_records)} daily price records to Supabase.")
        except Exception as db_err:
            logger.error(f"Database error upserting daily prices: {db_err}")
            
    return scraped_records
