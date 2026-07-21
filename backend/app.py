import os
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from backend.routes import router

app = FastAPI(
    title="MSRIT Academic Publication Data Aggregator API",
    description="Enterprise-grade production REST & SSE backend serving React static assets and wrapping 00.py extraction engine",
    version="2.5.0-PROD"
)

# Custom exception handling to ensure structured JSON error responses
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": f"Internal server error: {str(exc)}"}
    )

# Enable CORS — allow_credentials=True requires explicit origins (not "*")
# Wildcard origins are NOT compatible with credentials=True per the CORS spec.
# List every origin that will make credentialed requests.
ALLOWED_ORIGINS = [
    "http://localhost:5173",        # Vite dev server
    "http://localhost:4173",        # Vite preview
    "http://127.0.0.1:5173",
    "http://192.168.1.37:5173",     # LAN dev access
    "https://executory-recriminatory-ellison.ngrok-free.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include API router strictly on /api path to remove duplicate routes
app.include_router(router, prefix="/api")

# Mount React static files in production if dist exists
frontend_dist = os.path.join(WORKSPACE_ROOT, "frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
