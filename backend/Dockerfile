FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/backend/
COPY main.py /app/main.py

ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV PORT=8080

EXPOSE 8080

CMD ["python", "main.py"]
