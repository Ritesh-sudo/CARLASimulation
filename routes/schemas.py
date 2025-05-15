from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from .enums.user_group_type import UserGroupType
# schemas for input validation
class OrganizationCreate(BaseModel):
    org_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class OrganizationOut(BaseModel):
    org_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

class UserGroupCreate(BaseModel):
    name: str
    group_type: UserGroupType
    description: Optional[str] = None
    permissions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

    class Config:
        from_attributes = True  # Updated from orm_mode = True

class UserGroupOut(BaseModel):
    group_id: int
    name: str
    group_type: str
    description: Optional[str]
    permissions: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True  # Updated from orm_mode = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    org_id: int
    user_group_id: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

    class Config:
        orm_mode = True


class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    org_id: int
    user_group_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username: str
    password: str

    class Config:
        orm_mode = True

class RobotBase(BaseModel):
    class Config:
        from_attributes = True  # Updated from orm_mode = True

class RobotCreate(RobotBase):
    model: str
    version: str  # Or perhaps float, depending on expected format
    org_id: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class RobotOut(RobotBase):
    robot_id: int
    org_id: int
    model: str
    version: str
    org_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

class ScheduleBase(BaseModel):
    robot_id: int
    start_time: time  # Use datetime.time for Pydantic
    end_time: time    # Use datetime.time for Pydantic
    frequency: str
    is_active: bool = True

class ScheduleCreate(ScheduleBase):
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class ScheduleOut(ScheduleBase):
    schedule_id: int
    created_at: datetime
    updated_at: datetime
    # start_time, end_time, robot_id, frequency, is_active are inherited from ScheduleBase

    class Config:
        from_attributes = True # or orm_mode = True

class RoutesOut(BaseModel):
    route_id: int
    name: str
    description: Optional[str] = None
    org_id: int
    waypoints: str  # Assuming waypoints are stored as a JSON string
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        

class RoutesCreate(BaseModel):
    name: str
    description: Optional[str] = None
    org_id: int
    waypoints: str  # Assuming waypoints are stored as a JSON string
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True