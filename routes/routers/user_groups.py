from fastapi import FastAPI, APIRouter, Depends, status, requests, HTTPException
from .. import models, schemas
from .. dbconfig import sessionLocal, get_db
from sqlalchemy.exc import IntegrityError
from ..enums.user_group_type import UserGroupType
import json
from fastapi.encoders import jsonable_encoder


router = APIRouter(
    prefix="/user_groups",
    tags=["user_groups"]
)

@router.get("/")
def get_user_groups():
    return {"message": "Hello, this is the user_groups endpoint!"}

@router.post("/create_user_group", status_code=status.HTTP_201_CREATED)
def create_user_group(user_group: schemas.UserGroupCreate, db: sessionLocal = Depends(get_db)):
    """
    Create a new user group with specified permissions.
    
    Args:
        user_group: User group data including type and permissions
        db: Database session
    
    Returns:
        Created user group object
    
    Raises:
        HTTPException: If group type is invalid or name already exists
    """
    try:
        # Get permissions and convert to JSON string
        permissions = get_default_permissions(user_group.group_type)
        permissions_json = json.dumps(permissions)
        
        new_user_group = models.UserGroup(
            name=user_group.name,
            group_type=user_group.group_type.value,  # Use .value for enum
            description=user_group.description,
            permissions=permissions_json,  # Store as JSON string
            created_at=user_group.created_at,
            updated_at=user_group.updated_at,
            is_active=user_group.is_active
        )
        
        db.add(new_user_group)
        db.commit()
        db.refresh(new_user_group)
        return new_user_group
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"User group with name '{user_group.name}' already exists"
        )

def get_default_permissions(group_type: UserGroupType) -> dict:
    """Define default permissions for each user group type"""
    permissions = {
        UserGroupType.SUPER_ADMIN: {
            "can_manage_users": True,
            "can_manage_groups": True,
            "can_manage_orgs": True,
            "can_view_logs": True,
            "can_manage_settings": True,
            "can_delete_data": True
        },
        UserGroupType.ADMIN: {
            "can_manage_users": True,
            "can_manage_groups": False,
            "can_manage_orgs": False,
            "can_view_logs": True,
            "can_manage_settings": True,
            "can_delete_data": False
        },
        UserGroupType.OPERATOR: {
            "can_manage_users": False,
            "can_manage_groups": False,
            "can_manage_orgs": False,
            "can_view_logs": True,
            "can_manage_settings": False,
            "can_delete_data": False
        }
    }
    return permissions.get(group_type, {})
    """
    Create a new user group in the database.

    Args:
        user_group (schemas.UserGroupCreate): The user group data to create.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A message indicating the result of the operation.
    """

    new_user_group = models.UserGroup(
        name=user_group.name,
        description=user_group.description,
        created_at=user_group.created_at,
        updated_at=user_group.updated_at,
        is_active=user_group.is_active
    )

    db.add(new_user_group)
    db.commit()
    db.refresh(new_user_group)
    return new_user_group