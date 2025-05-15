from fastapi import FastAPI, APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from .. dbconfig import get_db

router = APIRouter(
    prefix="/routes",
    tags=["Routes"]
)

# in the robot api end point
@router.get("/")
def get_route():
    return {"message": "Hello, this is the robot endpoint!"}

# get the robot routes
@router.get("/get_robot_routes", response_model=List[schemas.RoutesOut])
def get_robot_routes(db: Session = Depends(get_db)):
    """
    Get all robot routes from the database
    """
    try:
        routes = db.query(models.Routes).filter(models.Routes.is_active == True).all()
        return routes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch robot routes: {str(e)}"
        )
    
@router.post("/create_robot_route", status_code=status.HTTP_201_CREATED, response_model=schemas.RoutesOut)
def create_robot_route(route: schemas.RoutesCreate, db: Session = Depends(get_db)):
    """
    Create a new robot patrol route.

    - **name**: Name of the route (required).
    - **description**: Optional description for the route.
    - **org_id**: ID of the organization this route belongs to (required).
    - **waypoints**: JSON string representing an array of waypoint objects (required).
      Each waypoint object should have:
      - `sequence_order`: (integer) The order of the waypoint in the route.
      - `latitude`: (float) Latitude of the waypoint.
      - `longitude`: (float) Longitude of the waypoint.
      - `name`: (string, optional) A name for the waypoint.
    - **is_active**: Boolean indicating if the route is active (defaults to True).
    """
    # Create a new SQLAlchemy model instance from the Pydantic schema
    # The `created_at` and `updated_at` fields in schemas.RoutesCreate
    # have default_factory=datetime.now, so they will be populated.
    new_route = models.Routes(
        name=route.name,
        description=route.description,
        org_id=route.org_id,
        waypoints=route.waypoints, # Stored as TEXT (JSON string)
        is_active=route.is_active,
        created_at=route.created_at, # Uses the default from Pydantic model
        updated_at=route.updated_at  # Uses the default from Pydantic model
    )

    # Add the new route to the database session
    db.add(new_route)
    # Commit the transaction to save the route to the database
    db.commit()
    # Refresh the instance to get any database-generated values (like route_id)
    db.refresh(new_route)

    return new_route
