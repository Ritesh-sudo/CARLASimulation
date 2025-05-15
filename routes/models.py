from . dbconfig import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, Time, DECIMAL, CHAR, VARCHAR, BigInteger, DateTime, Text
from sqlalchemy import Column, Integer, String
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy import Column, ForeignKey
from sqlalchemy.ext.declarative import declarative_base


class Organization(Base):
    __tablename__ = "organization"
    org_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

class UserGroup(Base):
    __tablename__ = "user_groups"
    
    group_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    group_type = Column(String(50))
    description = Column(String(255), nullable=True)
    permissions = Column(Text)  # Store JSON as TEXT in MySQL
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

class User(Base):
    __tablename__ = "user"
    user_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False)
    user_group_id = Column(Integer, ForeignKey("user_groups.group_id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

class Robot(Base):
    __tablename__ = "robot"
    robot_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    model = Column(String(255), nullable=False)
    version = Column(String(255), nullable=False)
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)


class RobotStatus(Base):
    __tablename__ = "robot_status"
    status_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    battery_level = Column(Float, nullable=False)  # Battery level as a percentage
    location_latitude = Column(DECIMAL, nullable=False)
    location_longitude = Column(DECIMAL, nullable=False)
    status_message = Column(String(255), nullable=True)  # e.g., "Idle", "In Transit"
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)

class Schedule(Base):
    __tablename__ = "schedule"
    schedule_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    frequency = Column(String(50), nullable=False)  # e.g., daily, weekly
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

class Routes(Base):
    __tablename__ = "routes"
    route_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String(255), nullable=False)  # A meaningful name for the route
    description = Column(Text, nullable=True)  # Optional details about the route
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False) # Link to organization
    waypoints = Column(Text, nullable=False)  # Store JSON array of waypoints as TEXT
    is_active = Column(Boolean, nullable=False, default=True) # Flag to enable/disable
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False)

class RoutesTrackingHistory(Base):
    __tablename__ = "routes_tracking_history"
    history_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.route_id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedule.schedule_id"), nullable=False)
    actual_latitude = Column(DECIMAL, nullable=False)
    actual_longitude = Column(DECIMAL, nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), nullable=False)

class SimulationSession(Base):
    __tablename__ = "simulation_session"
    session_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    simulated_route_id = Column(Integer, ForeignKey("routes.route_id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)

class Anomaly(Base):
    __tablename__ = "anomaly"
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.route_id"), nullable=False)
    detection_time = Column(DateTime, nullable=False)
    resolve_time = Column(DateTime, nullable=True)
    status = Column(String(255), nullable=False)
    resolved_by = Column(Integer, ForeignKey("user.user_id"), nullable=True)
    description = Column(Text, nullable=True)

class Notification(Base):
    __tablename__ = "notification"
    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    robot_id = Column(Integer, ForeignKey("robot.robot_id"), nullable=False)
    anomaly_id = Column(Integer, ForeignKey("anomaly.id"), nullable=False)
    org_id = Column(Integer, ForeignKey("organization.org_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)