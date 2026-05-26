from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, models, auth

router = APIRouter(
    prefix="/caretakers",
    tags=["caretakers"]
)

@router.get("/me", response_model=schemas.CaretakerResponse)
async def read_caretaker_me(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.Role.CARETAKER:
        raise HTTPException(status_code=400, detail="User is not a caretaker")
    return current_user.caretaker_profile

@router.put("/me", response_model=schemas.CaretakerResponse)
def update_caretaker_me(caretaker_update: schemas.CaretakerUpdate, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.Role.CARETAKER:
        raise HTTPException(status_code=400, detail="User is not a caretaker")
    
    caretaker = current_user.caretaker_profile
    if not caretaker:
        raise HTTPException(status_code=404, detail="Caretaker profile not found")

    if caretaker_update.experience_years is not None:
        caretaker.experience_years = caretaker_update.experience_years
    if caretaker_update.specialization is not None:
        caretaker.specialization = caretaker_update.specialization
    if caretaker_update.driving_license is not None:
        caretaker.driving_license = caretaker_update.driving_license
    
    db.commit()
    db.refresh(caretaker)
    return caretaker

@router.put("/me/availability")
def update_availability(is_available: bool, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.Role.CARETAKER:
        raise HTTPException(status_code=400, detail="User is not a caretaker")
    caretaker = current_user.caretaker_profile
    caretaker.is_available = is_available
    db.commit()
    db.commit()
    return {"status": "success", "is_available": is_available}

@router.put("/me/location")
def update_location(latitude: float, longitude: float, current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.Role.CARETAKER:
        raise HTTPException(status_code=400, detail="User is not a caretaker")
    
    current_user.latitude = latitude
    current_user.longitude = longitude
    db.commit()
    return {"status": "success", "latitude": latitude, "longitude": longitude}

@router.get("/", response_model=List[schemas.CaretakerResponse]) # Admin only or User search
def read_caretakers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # If admin, show all. If user, show approved only? 
    # For now, let's show all for admin.
    if current_user.role == models.Role.ADMIN:
        return db.query(models.Caretaker).offset(skip).limit(limit).all()
    else:
        # Users see approved and available caretakers
        return db.query(models.Caretaker).filter(models.Caretaker.is_approved == True).offset(skip).limit(limit).all()

@router.post("/{caretaker_id}/approve") # Admin only
def approve_caretaker(caretaker_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    caretaker = db.query(models.Caretaker).filter(models.Caretaker.id == caretaker_id).first()
    if not caretaker:
        raise HTTPException(status_code=404, detail="Caretaker not found")
    caretaker.is_approved = True
    db.commit()
    return {"status": "approved"}

@router.delete("/{caretaker_id}")
def delete_caretaker(caretaker_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    caretaker = db.query(models.Caretaker).filter(models.Caretaker.id == caretaker_id).first()
    if not caretaker:
        raise HTTPException(status_code=404, detail="Caretaker not found")
    
    user = caretaker.user
    
    db.query(models.LocationTracking).filter(models.LocationTracking.caretaker_id == caretaker_id).delete(synchronize_session=False)
    db.query(models.BookingRejection).filter(models.BookingRejection.caretaker_id == caretaker_id).delete(synchronize_session=False)
    
    bookings = db.query(models.Booking).filter(models.Booking.caretaker_id == caretaker_id).all()
    for b in bookings:
        b.caretaker_id = None
        b.status = models.BookingStatus.PENDING
    
    db.delete(caretaker)
    if user:
        user.role = models.Role.USER
    db.commit()
    return {"status": "success", "message": "Caretaker profile deleted"}
