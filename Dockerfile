# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve using FastAPI + Python
FROM python:3.11-slim
WORKDIR /app

# Install system utilities + Chromium for scholarly (Google Scholar scraping)
RUN apt-get update && apt-get install -y \
    build-essential \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium path for scholarly / selenium
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY 00.py ./00.py

# Copy pre-extracted faculty data (serves cached results immediately)
COPY generated/ ./generated/

# Copy frontend static build assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure generated output directories exist (in case generated/ was empty)
RUN mkdir -p generated/csv generated/json generated/excel generated/pdf

# Expose server port
EXPOSE 8000

# Set environment
ENV PORT=8000

# Start FastAPI server
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
