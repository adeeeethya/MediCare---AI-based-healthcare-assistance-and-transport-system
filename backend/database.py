from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use environment variable for DB URL or fallback to a local default
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost/medicare")

# Async engine support is preferred for FastAPI but synchronous is easier for initial setup.
# Sticking to synchronous driven by requirements for simplicity unless high concurrency needed immediately.
# Actually, for real-time tracking, async might be better (asyncpg). 
# But for now, let's stick to standard sync for simplicity and stability in initial setup.

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
