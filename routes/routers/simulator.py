from fastapi import APIRouter, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
from ..config import settings

router = APIRouter(prefix="/api/carla_stream", tags=["simulator"])  # Changed prefix

@router.get("/security_bot_data", response_model=List[dict])  # Changed endpoint name
async def get_simulator_data():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DATABASE]
        collection = db[settings.MONGODB_COLLECTION]
        
        cursor = collection.find({})
        documents = await cursor.to_list(length=100)  # Limit to 100 records
        
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch simulator data: {str(e)}"
        )