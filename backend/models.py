from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class Role(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    CARETAKER = "caretaker"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    ON_THE_WAY = "on_the_way"
    IN_SERVICE = "in_service"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=Role.USER)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    caretaker_profile = relationship("Caretaker", back_populates="user", uselist=False)
    bookings_as_user = relationship("Booking", foreign_keys="Booking.user_id", back_populates="user")

class Caretaker(Base):
    __tablename__ = "caretakers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    aadhar_number = Column(String, unique=True)
    driving_license = Column(String, nullable=True)
    experience_years = Column(Integer)
    specialization = Column(String)
    is_approved = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="caretaker_profile")
    bookings_as_caretaker = relationship("Booking", foreign_keys="Booking.caretaker_id", back_populates="caretaker")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    caretaker_id = Column(Integer, ForeignKey("caretakers.id"), nullable=True)
    service_type = Column(String) # 'caretaker' or 'emergency_transport'
    has_car = Column(Boolean, default=False)
    target_hospital = Column(String, nullable=True)
    status = Column(String, default=BookingStatus.PENDING)
    scheduled_time = Column(DateTime)
    duration_hours = Column(Float)
    total_amount = Column(Float, nullable=True)
    start_location_lat = Column(Float)
    start_location_lng = Column(Float)
    address = Column(String)
    notes = Column(Text, nullable=True)
    emergency_flag = Column(Boolean, default=False)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="bookings_as_user")
    caretaker = relationship("Caretaker", foreign_keys=[caretaker_id], back_populates="bookings_as_caretaker")
    payment = relationship("Payment", back_populates="booking", uselist=False)

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    amount = Column(Float)
    razorpay_order_id = Column(String)
    razorpay_payment_id = Column(String, nullable=True)
    status = Column(String, default="pending")
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    booking = relationship("Booking", back_populates="payment")

class LocationTracking(Base):
    __tablename__ = "location_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    caretaker_id = Column(Integer, ForeignKey("caretakers.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AILog(Base):
    __tablename__ = "ai_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class BookingRejection(Base):
    __tablename__ = "booking_rejections"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    caretaker_id = Column(Integer, ForeignKey("caretakers.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    booking = relationship("Booking")
    caretaker = relationship("Caretaker")
