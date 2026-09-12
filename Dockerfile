FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for OR-Tools, LightGBM, and C++ extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# Copy source code and entrypoint
COPY backend/ ./backend/
COPY main.py ./main.py

ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV PORT=8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start via direct Python entrypoint
CMD ["python", "main.py"]
