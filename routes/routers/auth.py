from fastapi import HTTPException, Response, status, Depends, APIRouter
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from ..dbconfig import get_db
from ..import models, schemas, utils, oauth2

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/")
def get_auth():
    """
    Root endpoint for authentication.

    Returns:
        dict: A message indicating the status of the authentication endpoint.
    """
    return {"message": "Hello, this is the auth endpoint!"}

@router.post("/login")
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate a user and return an access token.

    Args:
        user_credentials (OAuth2PasswordRequestForm): The user's login credentials.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A dictionary containing the access token and token type.
    """
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid credentials")
    
    if not utils.verify_password(user_credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid credentials")
    
    access_token = oauth2.create_access_token(
        data={"uid": user.user_id, "username": user.username, "org_id": user.org_id, "user_group_id": user.user_group_id},
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_info": {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "org_id": user.org_id,
            "user_group_id": user.user_group_id
        }    
    }
