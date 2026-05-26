from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, models, auth

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[schemas.UserResponse]) # Admin only
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    users = db.query(models.User).filter(models.User.role == models.Role.USER).offset(skip).limit(limit).all()
    return users

@router.delete("/{user_id}", status_code=204) # Admin only
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Manually delete associated AI logs
    db.query(models.AILog).filter(models.AILog.user_id == user.id).delete(synchronize_session=False)
    
    # For bookings where they are the user
    user_bookings = db.query(models.Booking).filter(models.Booking.user_id == user.id).all()
    for b in user_bookings:
        # Delete payments
        db.query(models.Payment).filter(models.Payment.booking_id == b.id).delete(synchronize_session=False)
        # Delete rejections
        db.query(models.BookingRejection).filter(models.BookingRejection.booking_id == b.id).delete(synchronize_session=False)
        # Delete booking
        db.delete(b)
        
    # If they are a caretaker, clean up caretaker dependencies
    if user.caretaker_profile:
        caretaker_id = user.caretaker_profile.id
        db.query(models.LocationTracking).filter(models.LocationTracking.caretaker_id == caretaker_id).delete(synchronize_session=False)
        db.query(models.BookingRejection).filter(models.BookingRejection.caretaker_id == caretaker_id).delete(synchronize_session=False)
        
        # Unassign from caretaker bookings
        c_bookings = db.query(models.Booking).filter(models.Booking.caretaker_id == caretaker_id).all()
        for b in c_bookings:
            b.caretaker_id = None
            b.status = models.BookingStatus.PENDING
            
        db.delete(user.caretaker_profile)
        db.flush()
        
    db.delete(user)
    db.commit()
    return None
