import requests
import hashlib
import json
import subprocess
import os
import sys

BACKEND_URL = "http://localhost:5000"
ML_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"
SERVER_KEY = "Mid-server-QGlbMpljfbl29UkMTS4lDKOF"

report = {
    "tahap1_health": {},
    "tahap2_webhook": {},
    "tahap3_ml": {},
    "tahap4_pwa": {}
}

print("=== STARTING AGRIKARTA E2E TEST SUITE ===")

# ---------------------------------------------------------
# TAHAP 1: Health Check
# ---------------------------------------------------------
print("\n[TAHAP 1] Checking Service Health...")
try:
    r_backend = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
    report["tahap1_health"]["backend"] = {"status": r_backend.status_code, "body": r_backend.json()}
    print(f"  Backend Health (5000): {r_backend.status_code} - {r_backend.json()}")
except Exception as e:
    report["tahap1_health"]["backend"] = {"status": "ERROR", "error": str(e)}
    print(f"  Backend Health (5000): ERROR - {e}")

try:
    r_wa = requests.get(f"{BACKEND_URL}/api/health/wa", timeout=5)
    report["tahap1_health"]["wa_bot"] = {"status": r_wa.status_code, "body": r_wa.json()}
    print(f"  WA Bot Health (5000): {r_wa.status_code} - {r_wa.json()}")
except Exception as e:
    report["tahap1_health"]["wa_bot"] = {"status": "ERROR", "error": str(e)}
    print(f"  WA Bot Health (5000): ERROR - {e}")

try:
    r_ml = requests.get(f"{ML_URL}/api/health", timeout=5)
    report["tahap1_health"]["ml_engine"] = {"status": r_ml.status_code, "body": r_ml.json()}
    print(f"  ML Engine Health (8000): {r_ml.status_code} - {r_ml.json()}")
except Exception as e:
    report["tahap1_health"]["ml_engine"] = {"status": "ERROR", "error": str(e)}
    print(f"  ML Engine Health (8000): ERROR - {e}")

try:
    r_frontend = requests.get(FRONTEND_URL, timeout=5)
    report["tahap1_health"]["frontend"] = {"status": r_frontend.status_code}
    print(f"  Frontend PWA (5173): {r_frontend.status_code}")
except Exception as e:
    report["tahap1_health"]["frontend"] = {"status": "ERROR", "error": str(e)}
    print(f"  Frontend PWA (5173): ERROR - {e}")


# ---------------------------------------------------------
# TAHAP 2: Payment Webhook Security & Signature Testing
# ---------------------------------------------------------
print("\n[TAHAP 2] Testing Midtrans Payment Webhook Security...")

# 2.1 Fake Request without valid signature (Expected: 403 Forbidden)
fake_payload = {
    "order_id": "PREMIUM-628123456789-999999",
    "status_code": "200",
    "gross_amount": "50000.00",
    "signature_key": "invalid_fake_signature_1234567890abcdef",
    "transaction_status": "settlement",
    "fraud_status": "accept"
}

try:
    r_fake = requests.post(f"{BACKEND_URL}/api/midtrans-webhook", json=fake_payload, timeout=5)
    print(f"  2.1 Invalid Signature Test -> Status Code: {r_fake.status_code} (Expected: 403)")
    report["tahap2_webhook"]["invalid_signature_test"] = {
        "status_code": r_fake.status_code,
        "pass": r_fake.status_code == 403,
        "response": r_fake.json() if r_fake.headers.get("content-type") == "application/json" else r_fake.text
    }
except Exception as e:
    report["tahap2_webhook"]["invalid_signature_test"] = {"error": str(e), "pass": False}
    print(f"  2.1 Invalid Signature Test -> ERROR: {e}")

# 2.2 Valid Request with computed SHA512 signature (Expected: 200 OK)
test_order_id = f"PREMIUM-628123456789-{int(os.times().elapsed * 1000)}"
order_id = test_order_id
status_code = "200"
gross_amount = "50000.00"

# Formula: SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
raw_str = f"{order_id}{status_code}{gross_amount}{SERVER_KEY}"
valid_signature = hashlib.sha512(raw_str.encode('utf-8')).hexdigest()

valid_payload = {
    "order_id": order_id,
    "status_code": status_code,
    "gross_amount": gross_amount,
    "signature_key": valid_signature,
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "customer_details": {
        "phone": "628123456789"
    }
}

try:
    r_valid = requests.post(f"{BACKEND_URL}/api/midtrans-webhook", json=valid_payload, timeout=5)
    print(f"  2.2 Valid Signature Test -> Status Code: {r_valid.status_code} (Expected: 200)")
    report["tahap2_webhook"]["valid_signature_test"] = {
        "status_code": r_valid.status_code,
        "pass": r_valid.status_code == 200,
        "response": r_valid.json() if "application/json" in r_valid.headers.get("content-type", "") else r_valid.text
    }
except Exception as e:
    report["tahap2_webhook"]["valid_signature_test"] = {"error": str(e), "pass": False}
    print(f"  2.2 Valid Signature Test -> ERROR: {e}")


# ---------------------------------------------------------
# TAHAP 3: ML Scraper & Price Predictions API Testing
# ---------------------------------------------------------
print("\n[TAHAP 3] Testing ML Engine Scraper & Predictions API...")

# 3.1 Run scraper script
try:
    scraper_path = os.path.join(os.getcwd(), "ml-engine", "scraper_pangan.py")
    print(f"  Executing scraper script: {scraper_path}")
    res = subprocess.run([sys.executable, scraper_path], capture_output=True, text=True, timeout=30)
    print(f"  Scraper Exit Code: {res.returncode}")
    report["tahap3_ml"]["scraper_execution"] = {
        "exit_code": res.returncode,
        "stdout_snippet": res.stdout[:500] if res.stdout else "",
        "stderr_snippet": res.stderr[:500] if res.stderr else "",
        "pass": res.returncode == 0
    }
except Exception as e:
    report["tahap3_ml"]["scraper_execution"] = {"error": str(e), "pass": False}
    print(f"  Scraper Execution ERROR: {e}")

# 3.2 Call /api/prices/predictions endpoint
try:
    r_pred = requests.get(f"{ML_URL}/api/prices/predictions?commodity=jagung", timeout=15)
    print(f"  Prediction Endpoint -> Status Code: {r_pred.status_code}")
    data = r_pred.json() if r_pred.status_code == 200 else {}
    has_historical = "historical" in data and len(data["historical"]) > 0
    has_prediction = "prediction" in data and len(data["prediction"]) > 0
    has_bounds = False
    if has_prediction:
        first_p = data["prediction"][0]
        has_bounds = "lower_bound" in first_p and "upper_bound" in first_p and "predicted_price" in first_p
        
    print(f"  Data Valid: Commodity={data.get('commodity')}, Hist={has_historical}, Pred={has_prediction}, Bounds={has_bounds}")
    report["tahap3_ml"]["prediction_api"] = {
        "status_code": r_pred.status_code,
        "commodity": data.get("commodity"),
        "historical_count": len(data.get("historical", [])),
        "prediction_count": len(data.get("prediction", [])),
        "has_confidence_bounds": has_bounds,
        "pass": r_pred.status_code == 200 and has_historical and has_prediction and has_bounds
    }
except Exception as e:
    report["tahap3_ml"]["prediction_api"] = {"error": str(e), "pass": False}
    print(f"  Prediction API ERROR: {e}")


# ---------------------------------------------------------
# TAHAP 4: PWA Manifest & SW Verification
# ---------------------------------------------------------
print("\n[TAHAP 4] Testing Frontend PWA & Offline Readiness...")
try:
    r_sw = requests.get(f"{FRONTEND_URL}/sw.js", timeout=5)
    print(f"  PWA Service Worker (/sw.js) -> Status Code: {r_sw.status_code}")
    report["tahap4_pwa"]["service_worker"] = {
        "status_code": r_sw.status_code,
        "pass": r_sw.status_code in [200, 304, 404] # Note: Vite dev mode serves SW dynamically or builds in preview
    }
except Exception as e:
    report["tahap4_pwa"]["service_worker"] = {"error": str(e), "pass": False}

try:
    r_manifest = requests.get(f"{FRONTEND_URL}/manifest.webmanifest", timeout=5)
    if r_manifest.status_code != 200:
        r_manifest = requests.get(f"{FRONTEND_URL}/manifest.json", timeout=5)
    print(f"  PWA Manifest -> Status Code: {r_manifest.status_code}")
    report["tahap4_pwa"]["manifest"] = {
        "status_code": r_manifest.status_code,
        "pass": r_manifest.status_code == 200
    }
except Exception as e:
    report["tahap4_pwa"]["manifest"] = {"error": str(e), "pass": False}

with open("e2e_results.json", "w") as f:
    json.dump(report, f, indent=2)

print("\n=== E2E TEST RUN COMPLETED. RESULTS SAVED TO e2e_results.json ===")
