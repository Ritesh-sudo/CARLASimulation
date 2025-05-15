from sqlalchemy import create_engine, exc, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from .config import settings
import time
from fastapi import FastAPI, HTTPException, Depends
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


try:
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{settings.DB_USERNAME}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        
except exc.OperationalError as e:
    logger.error(f"❌ Database connection failed: {str(e)}")
    raise HTTPException(
        status_code=500,
        detail="Could not connect to database"
    )

sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database dependency with error handling"""
    db = sessionLocal()
    try:
        # Test connection before yielding
        db.execute(text("SELECT 1"))
        yield db
    except exc.OperationalError as e:
        logger.error(f"❌ Database session error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Database connection error"
        )
    finally:
        db.close()
        logger.debug("Database connection closed")