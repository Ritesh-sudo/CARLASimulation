from fastapi import FastAPI, APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from .. dbconfig import get_db

router = APIRouter(
    prefix="/robot",
    tags=["Robots"]
)

# in the robot api end point
@router.get("/")
def get_robot():
    return {"message": "Hello, this is the robot endpoint!"}

# user creates a robot in front end by clicking a button  (model, version, org_id)  
@router.post("/create_robot", status_code=status.HTTP_201_CREATED, response_model=schemas.RobotOut)
def create_robot(robot: schemas.RobotCreate, db: Session = Depends(get_db)):
    """
    Create a new robot in the database.

    Args:
        robot (schemas.RobotCreate): The robot data to create.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A message indicating the result of the operation.
    """
    new_robot = models.Robot(
        model=robot.model,
        version=robot.version,
        org_id=robot.org_id,
        created_at=robot.created_at,
        updated_at=robot.updated_at,
        is_active=robot.is_active
    )

    db.add(new_robot)
    db.commit()
    db.refresh(new_robot)
    return new_robot

#get all robots
@router.get("/get_robots", response_model=List[schemas.RobotOut])
def get_robots(db: Session = Depends(get_db)):
    """
    Get all robots from the database
    """
    try:
        robots = db.query(models.Robot).filter(models.Robot.is_active == True).all()
        return robots
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch robots: {str(e)}"
        )

@router.get("/get_robot/{robot_id}", response_model=schemas.RobotOut)
def get_robot(robot_id: int, db: Session = Depends(get_db)):
    robot = db.query(models.Robot).filter(models.Robot.robot_id == robot_id, models.Robot.is_active == True).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot

@router.post("/add_robot", status_code=status.HTTP_201_CREATED, response_model=schemas.RobotOut)
def add_robot(robot: schemas.RobotCreate, db: Session = Depends(get_db)):
    """
    Add a new robot to the database.

    Args:
        robot (schemas.RobotCreate): The robot data to add.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: The created robot data.
    """
    new_robot = models.Robot(
        model=robot.model,
        version=robot.version,
        org_id=robot.org_id,
        created_at=robot.created_at,
        updated_at=robot.updated_at,
        is_active=robot.is_active
    )

    db.add(new_robot)
    db.commit()
    db.refresh(new_robot)
    return new_robot
