from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    CARETAKER = "caretaker"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Role = Role.USER
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    # Location fields for tracking
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class CaretakerBase(BaseModel):
    aadhar_number: str
    driving_license: Optional[str] = None
    experience_years: int
    specialization: str

class CaretakerCreate(CaretakerBase):
    user: UserCreate

class CaretakerResponse(CaretakerBase):
    id: int
    user_id: int
    is_approved: bool
    is_available: bool
    rating: float
    user: UserResponse

    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    service_type: str
    scheduled_time: datetime
    duration_hours: float
    address: str
    has_car: bool = False
    target_hospital: Optional[str] = None
    notes: Optional[str] = None
    emergency_flag: bool = False

class BookingCreate(BookingBase):
    limit_lat: float
    limit_lng: float

class BookingResponse(BookingBase):
    id: int
    user_id: int
    caretaker_id: Optional[int] = None
    status: str
    total_amount: Optional[float] = None
    start_location_lat: float
    start_location_lng: float
    # Nested caretaker for tracking
    caretaker: Optional[CaretakerResponse] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # No role, email, or password update allowed here normally

class CaretakerUpdate(BaseModel):
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    driving_license: Optional[str] = None

