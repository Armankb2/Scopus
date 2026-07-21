# MSRIT Academic Publication Data Aggregator

An enterprise-grade, high-performance web application designed to select faculty members and generate/visualize their complete academic publication portfolio. The portal executes a unified extraction engine wrapping Elsevier Scopus, Google Scholar, and CrossRef APIs, presenting structured datasets and metrics analysis in a premium, glassmorphism-themed interactive dashboard.

---

## Technical Architecture

The application is structured into two decoupled directories for the backend and frontend:

- **Backend (FastAPI)**: Integrates `00.py` dynamically using Python's `importlib`. It streams real-time extraction progress via Server-Sent Events (SSE) and handles spreadsheet generation (Excel/CSV) and PDF report compilation.
- **Frontend (React 19, Vite, TS, Tailwind CSS)**: Styled with a premium Vercel/Linear dark/light glassmorphic layout. Includes an interactive TanStack table, visual charts (Recharts), and a detail inspection drawer.

---

## Local Development & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+

### 1. Backend Setup
1. Create a virtual environment and install packages:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```
2. Run the FastAPI development server:
   ```bash
   python -m uvicorn backend.app:app --port 8000 --reload
   ```
   The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup
1. Navigate to the `frontend` directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend UI will be available at `http://localhost:5173`.

---

## Production & Containerized Deployment

The workspace contains a multi-stage `Dockerfile` that packages the compiled static React frontend assets directly into the FastAPI backend image, allowing the entire system to run within a single, lightweight Docker container.

### Running with Docker Compose
1. Ensure your `.env` file contains your Elsevier credentials (optional):
   ```bash
   cp .env.example .env
   ```
2. Build and spin up the containerized stack:
   ```bash
   docker-compose up -d --build
   ```
   The application will be accessible at `http://localhost:8000` (serving both the React interface at `/` and the endpoints at `/api`).

### Deploying to Render, Railway, or VPS
- **Render / Railway**: Link the repository and point the build to the `Dockerfile`. Define port `8000` in your dashboard.
- **Linux Server / VPS**: Install Docker, clone the repo, copy your `.env` configuration, and run `docker-compose up -d --build`.

---

## REST API Documentation

- `GET /faculty`: Retrieves the default list of CSE faculty from `00.py`
- `POST /fetch`: Fetches (or serves cached) publication rows and metrics
- `POST /fetch/start`: Starts a background extraction job and returns a `job_id`
- `GET /progress/{job_id}`: EventSource (SSE) progress endpoint streaming live extraction steps
- `GET /download/pdf/{filename}`: Downloads the custom-generated PDF report
- `GET /download/excel/{filename}`: Downloads the compiled Excel sheet
- `GET /health`: System checks on Scopus/Scholar API accessibility
