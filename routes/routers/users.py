from datetime import datetime
from fastapi import HTTPException, Response, status, Depends, APIRouter
from sqlalchemy.orm import Session
from .. import models, schemas
from ..dbconfig import sessionLocal, get_db
from .. import utils
from ..enums.user_group_type import UserGroupType


# Create a router object
router = APIRouter(
    prefix="/users",
    tags=['Users']
)
@router.get("/")
def get_users():
    return {"message": "Hello, this is the users endpoint!"}


@router.post("/create_user", status_code=status.HTTP_201_CREATED, response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user in the database.
    Args:
        user (schemas.UserCreate): The user data to create.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A message indicating the result of the operation.
    """
    #check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    #check if username already exists
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Hash the password
    hashed_password = utils.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        org_id=user.org_id,
        user_group_id=user.user_group_id,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_active=user.is_active
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
