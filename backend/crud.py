from sqlalchemy.orm import Session
from typing import Optional
import models, schemas, security

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        address=user.address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_caretaker(db: Session, caretaker: schemas.CaretakerCreate):
    # First create the user part
    user_data = caretaker.user
    db_user = create_user(db, user_data)
    
    # Then create the caretaker profile
    db_caretaker = models.Caretaker(
        user_id=db_user.id,
        aadhar_number=caretaker.aadhar_number,
        driving_license=caretaker.driving_license,
        experience_years=caretaker.experience_years,
        specialization=caretaker.specialization
    )
    db.add(db_caretaker)
    db.commit()
    db.refresh(db_caretaker)
    return db_caretaker

def get_caretakers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Caretaker).offset(skip).limit(limit).all()

def get_available_caretakers(db: Session):
    return db.query(models.Caretaker).filter(models.Caretaker.is_available == True, models.Caretaker.is_approved == True).all()

def create_booking(db: Session, booking: schemas.BookingCreate, user_id: int):
    db_booking = models.Booking(**booking.dict(), user_id=user_id, status=models.BookingStatus.PENDING)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking
