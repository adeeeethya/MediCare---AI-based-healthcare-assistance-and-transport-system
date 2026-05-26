from database import SessionLocal
import models
from sqlalchemy.orm import Session

def check_bookings():
    db = SessionLocal()
    bookings = db.query(models.Booking).all()
    
    print(f"Total Bookings: {len(bookings)}")
    
    for b in bookings:
        print(f"Booking ID: {b.id}")
        print(f"  - User ID: {b.user_id}")
        print(f"  - Caretaker ID: {b.caretaker_id}")
        print(f"  - Status: {b.status}")
        print(f"  - Service: {b.service_type}")
        print("-" * 20)

    if not bookings:
        print("NO BOOKINGS FOUND.")

    db.close()

if __name__ == "__main__":
    check_bookings()
