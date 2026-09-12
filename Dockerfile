FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for OR-Tools, LightGBM, and C++ extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Set environment variables
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV PORT=8000
EXPOSE 8000

# Healthcheck probe using Railway's dynamic $PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start uvicorn dynamically binding to Railway's assigned $PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
