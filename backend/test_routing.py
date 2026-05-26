import sys
sys.path.append('c:\\MediCare\\backend')
import database, models, utils
from sqlalchemy.orm import Session
from datetime import datetime

with database.SessionLocal() as db:
    # Cleanup previous test
    db.query(models.Booking).filter(models.Booking.notes == "TEST_HAVERSINE").delete(synchronize_session=False)
    db.query(models.Caretaker).filter(models.Caretaker.specialization == "TEST_HAVERSINE").delete(synchronize_session=False)
    db.query(models.User).filter(models.User.email.like("test_hav_%")).delete(synchronize_session=False)
    db.commit()

    # Create User
    u1 = models.User(email="test_hav_c1@test.com", full_name="C1", hashed_password="fake", role=models.Role.CARETAKER, latitude=10.0, longitude=76.0)
    u2 = models.User(email="test_hav_c2@test.com", full_name="C2", hashed_password="fake", role=models.Role.CARETAKER, latitude=10.5, longitude=76.5)
    u3 = models.User(email="test_hav_user@test.com", full_name="User", hashed_password="fake", role=models.Role.USER)
    
    db.add_all([u1, u2, u3])
    db.commit()
    
    # Create Caretaker profiles
    c1 = models.Caretaker(user_id=u1.id, aadhar_number="HAV1", is_approved=True, is_available=True, specialization="TEST_HAVERSINE")
    c2 = models.Caretaker(user_id=u2.id, aadhar_number="HAV2", is_approved=True, is_available=True, specialization="TEST_HAVERSINE")
    
    db.add_all([c1, c2])
    db.commit()

    # Now run the routing logic
    from routers.bookings import get_nearest_available_caretaker

    # Test 1: Booking exactly at C1's location
    nearest1 = get_nearest_available_caretaker(db, 10.0, 76.0)
    print(f"Test 1 (At C1 - 10.0, 76.0): Assigned to {nearest1.user.full_name}")

    # Test 2: Booking exactly at C2's location
    nearest2 = get_nearest_available_caretaker(db, 10.5, 76.5)
    print(f"Test 2 (At C2 - 10.5, 76.5): Assigned to {nearest2.user.full_name}")

    # Test 3: Booking closer to C2 (10.4, 76.4)
    nearest3 = get_nearest_available_caretaker(db, 10.4, 76.4)
    print(f"Test 3 (Near C2 - 10.4, 76.4): Assigned to {nearest3.user.full_name}")

    # Cleanup
    db.query(models.Booking).filter(models.Booking.notes == "TEST_HAVERSINE").delete(synchronize_session=False)
    db.query(models.Caretaker).filter(models.Caretaker.specialization == "TEST_HAVERSINE").delete(synchronize_session=False)
    db.query(models.User).filter(models.User.email.like("test_hav_%")).delete(synchronize_session=False)
    db.commit()
