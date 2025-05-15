from fastapi import FastAPI, APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from .. dbconfig import get_db

router = APIRouter(
    prefix="/schedules",
    tags=["Schedules"]
)

#create a schedule
@router.post("/create_schedule", status_code=status.HTTP_201_CREATED, response_model=schemas.ScheduleOut)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db)):
    """
    Create a new schedule in the database.

    Args:
        schedule (schemas.ScheduleCreate): The schedule data to create.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A message indicating the result of the operation.
    """
    new_schedule = models.Schedule(
        robot_id=schedule.robot_id,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        frequency=schedule.frequency,
        is_active=schedule.is_active,
        created_at=schedule.created_at, # From Pydantic default_factory
        updated_at=schedule.updated_at  # From Pydantic default_factory
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule