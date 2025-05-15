import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError
from . import schemas, models
from . config import settings

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth")

# Function to create a JWT token    
def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Create a JWT access token.

    Args:
        data (dict): The data to include in the token.
        expires_delta (timedelta, optional): The expiration time delta. Defaults to None.

    Returns:
        str: The generated JWT token.
    """
    # Create a copy of the input data to prevent modifying the original dictionary.
    to_encode = data.copy()

    # Set the expiration time for the token.
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    # Add the expiration time to the payload.
    to_encode.update({"exp": expire})
    
    # Encode the payload into a JWT using the specified secret and algorithm.
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

