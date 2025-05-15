from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . dbconfig import get_db, engine
from . import models
from . import schemas
from .routers import org, user_groups, users, auth, robot, simulator, robot_routes, schedule
from dotenv import load_dotenv
import os

# Get the absolute path of the directory containing your script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Construct path to .env file
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path)

# Initialize FastAPI with metadata
app = FastAPI(
    title="Security Bot API",
    description="API for security monitoring and management",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
models.Base.metadata.create_all(bind=engine)
app.include_router(org.router)
app.include_router(user_groups.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(robot.router)
app.include_router(simulator.router)
app.include_router(robot_routes.router)
app.include_router(schedule.router)

@app.get("/")
async def read_root():
    """Root endpoint for API health check"""
    try:
        return {
            "status": "healthy",
            "message": "Welcome to the Security Bot API!"
        }
    except Exception as e:
        logger.error(f"Error in root endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
