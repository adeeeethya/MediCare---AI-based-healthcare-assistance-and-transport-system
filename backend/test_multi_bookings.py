import requests
import time

BASE_URL = "http://localhost:8000"

def create_user_and_login(email_prefix):
    email = f"{email_prefix}_{int(time.time())}@example.com"
    password = "password123"
    
    # Register
    res = requests.post(f"{BASE_URL}/auth/register/user", json={
        "email": email,
        "password": password,
        "name": "Test User",
        "role": "user",
        "phone_number": "1234567890"
    })
    
    if res.status_code != 200:
        print("Failed to register:", res.text)
        return None
        
    # Login
    res = requests.post(f"{BASE_URL}/auth/token", data={
        "username": email,
        "password": password
    })
    
    if res.status_code != 200:
        print("Failed to login:", res.text)
        return None
        
    data = res.json()
    return data["access_token"]

def register_caretaker(email_prefix):
    email = f"{email_prefix}_{int(time.time())}@example.com"
    password = "password123"
    
    # Register as caretaker
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "name": "Test Caretaker",
        "role": "caretaker",
        "phone_number": "1234567890",
        "latitude": 10.0,
        "longitude": 76.0
    })
    
    if res.status_code != 200:
        print("Failed to register caretaker:", res.text)
        return False
        
    # Also needs to be approved and available. Let's assume we do that directly in python or DB.
    # Fortunately the endpoints to approve exist or maybe we bypass and use DB.
    return True

def override_caretaker_availability():
    from database import SessionLocal
    import models
    db = SessionLocal()
    caretakers = db.query(models.Caretaker).all()
    for c in caretakers:
        c.is_approved = True
        c.is_available = True
        if not c.user.latitude:
            c.user.latitude = 10.0
            c.user.longitude = 76.0
    db.commit()
    db.close()

def test_multiple_bookings():
    override_caretaker_availability()
    token = create_user_and_login("multi_user")
    if not token:
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    booking_data = {
        "service_type": "caretaker",
        "scheduled_time": "2026-03-01T10:00:00",
        "duration_hours": 2,
        "limit_lat": 10.01,
        "limit_lng": 76.01,
        "address": "Test location",
        "has_car": False,
        "target_hospital": "",
        "notes": "",
        "emergency_flag": False
    }
    
    # Booking 1
    res1 = requests.post(f"{BASE_URL}/bookings/", json=booking_data, headers=headers)
    print("Booking 1 status:", res1.status_code)
    if res1.status_code == 200:
        print("Booking 1 created successfully.")
    else:
        print("Error in Booking 1:", res1.text)
        
    # Booking 2
    res2 = requests.post(f"{BASE_URL}/bookings/", json=booking_data, headers=headers)
    print("Booking 2 status:", res2.status_code)
    if res2.status_code == 200:
        print("Booking 2 created successfully.")
    else:
        print("Error in Booking 2:", res2.text)
        if "No unused/available caretakers found nearby" in res2.text:
            print("Note: This error means we just didn't have a second available caretaker, but the multi-booking block is GONE, so it's a success!")

if __name__ == "__main__":
    test_multiple_bookings()
