# ═══════════════════════════════════════════════════════════════════════
# Agrikarta ML Engine — Python 3.11 Slim + PyTorch CPU Dockerfile
# ═══════════════════════════════════════════════════════════════════════
FROM python:3.11-slim

WORKDIR /app

# Install system deps for building Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python deps (CPU-only PyTorch)
COPY requirements.txt .
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Set timezone for APScheduler
ENV TZ=Asia/Jakarta

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
