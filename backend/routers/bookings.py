from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, models, auth, utils, crud

router = APIRouter(
    prefix="/bookings",
    tags=["bookings"]
)

def get_nearest_available_caretaker(db: Session, user_lat: float, user_lng: float, exclude_caretaker_ids=None):
    if exclude_caretaker_ids is None:
        exclude_caretaker_ids = []
        
    caretakers = db.query(models.Caretaker).filter(models.Caretaker.is_available == True, models.Caretaker.is_approved == True).all()
    
    nearby_caretakers = []
    for caretaker in caretakers:
        if caretaker.id in exclude_caretaker_ids:
            continue
            

            
        if caretaker.user.latitude and caretaker.user.longitude:
            dist = utils.haversine(user_lat, user_lng, caretaker.user.latitude, caretaker.user.longitude)
            nearby_caretakers.append((caretaker, dist))
            
    if not nearby_caretakers:
        return None
        
    nearby_caretakers.sort(key=lambda x: x[1])
    return nearby_caretakers[0][0]

@router.post("/", response_model=schemas.BookingResponse)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    try:
        user_lat = booking.limit_lat
        user_lng = booking.limit_lng
        
        nearest_caretaker = get_nearest_available_caretaker(db, user_lat, user_lng)
        
        if not nearest_caretaker:
            raise HTTPException(status_code=404, detail="No unused/available caretakers found nearby")
        
        # Create booking
        db_booking = models.Booking(
            user_id=current_user.id,
            caretaker_id=nearest_caretaker.id,
            service_type=booking.service_type,
            status=models.BookingStatus.PENDING,
            scheduled_time=booking.scheduled_time,
            duration_hours=booking.duration_hours,
            start_location_lat=user_lat,
            start_location_lng=user_lng,
            address=booking.address,
            has_car=booking.has_car,
            target_hospital=booking.target_hospital,
            notes=booking.notes,
            emergency_flag=booking.emergency_flag
        )
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        
        return db_booking

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"CRITICAL ERROR creating booking: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.get("/", response_model=List[schemas.BookingResponse])
def read_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    print(f"DEBUG: read_bookings called by {current_user.email} (Role: {current_user.role})")
    
    if current_user.role == models.Role.ADMIN:
        bookings = db.query(models.Booking).offset(skip).limit(limit).all()
    elif current_user.role == models.Role.CARETAKER:
        if not current_user.caretaker_profile:
             print("DEBUG: User has Caretaker role but NO profile!")
             return []
        print(f"DEBUG: Fetching bookings for Caretaker ID: {current_user.caretaker_profile.id}")
        bookings = db.query(models.Booking).filter(models.Booking.caretaker_id == current_user.caretaker_profile.id).all()
    else:
        bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    
    print(f"DEBUG: Found {len(bookings)} bookings")
    return bookings

@router.put("/{booking_id}/status")
def update_booking_status(booking_id: int, status: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
         raise HTTPException(status_code=404, detail="Booking not found")
    
    if status == "rejected" and current_user.role == models.Role.CARETAKER:
        # Log rejection
        rejection = models.BookingRejection(
            booking_id=booking.id,
            caretaker_id=current_user.caretaker_profile.id
        )
        db.add(rejection)
        db.commit()
        
        # Find next available caretaker
        rejections = db.query(models.BookingRejection).filter(models.BookingRejection.booking_id == booking.id).all()
        exclude_ids = [r.caretaker_id for r in rejections]
        
        next_caretaker = get_nearest_available_caretaker(db, booking.start_location_lat, booking.start_location_lng, exclude_ids)
        
        if next_caretaker:
            booking.caretaker_id = next_caretaker.id
            booking.status = "pending"
            db.commit()
            return {"status": "success", "message": "Reassigned to next nearest caretaker", "booking_status": "pending"}
        else:
            booking.status = "cancelled"
            booking.notes = (booking.notes or "") + " [System: Cancelled as all caretakers rejected or are busy]"
            db.commit()
            return {"status": "success", "message": "Cancelled. No other caretakers available.", "booking_status": "cancelled"}
            
    booking.status = status
    db.commit()
    return {"status": "success", "booking_status": status}

@router.delete("/{booking_id}", status_code=204)
def delete_booking(booking_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check ownership
    if booking.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this booking")
    
    # Check status (can only delete pending or accepted)
    if booking.status not in [models.BookingStatus.PENDING, models.BookingStatus.ACCEPTED]:
        raise HTTPException(status_code=400, detail="Cannot cancel a booking that is already in progress or completed")
        
    # Delete associated rejections first to avoid foreign key violation
    db.query(models.BookingRejection).filter(models.BookingRejection.booking_id == booking_id).delete(synchronize_session=False)
        
    db.query(models.Booking).filter(models.Booking.id == booking_id).delete(synchronize_session=False)
    db.commit()
    return None
