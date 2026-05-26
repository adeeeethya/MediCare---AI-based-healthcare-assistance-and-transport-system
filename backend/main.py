import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, caretakers, bookings, payments, aimodules
import models, database

# Create tables (for dev only, use Alembic for prod)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MediCare API", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        print(f"Unhandled Exception: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": f"Internal Server Error: {str(e)}"})

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(caretakers.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(aimodules.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediCare API"}
