from database import SessionLocal
import models

def clear_pending():
    db = SessionLocal()
    # Delete all pending bookings to unblock the caretakers
    pending_bookings = db.query(models.Booking).filter(models.Booking.status == 'pending').all()
    count = len(pending_bookings)
    
    for b in pending_bookings:
        # Also clear any rejections tied to these bookings just in case
        db.query(models.BookingRejection).filter(models.BookingRejection.booking_id == b.id).delete(synchronize_session=False)
        db.delete(b)
        
    db.commit()
    print(f"Cleared {count} pending bookings. Caretakers are now free!")
    db.close()

if __name__ == "__main__":
    clear_pending()
