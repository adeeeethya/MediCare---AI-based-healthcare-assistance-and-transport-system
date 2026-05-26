import models, database, security
db = database.SessionLocal()
admins = db.query(models.User).filter(models.User.role == models.Role.ADMIN).all()

common_passwords = ["admin", "admin123", "password", "password123", "123456", "12345678", "admin@123", "Medicare@123", "medicare123", "admincredential4"]

print(f"Found {len(admins)} admins.")
for admin in admins:
    print(f"Admin Email: {admin.email}")
    password_found = False
    for pwd in common_passwords:
        if security.verify_password(pwd, admin.hashed_password):
            print(f"  -> Password for {admin.email} is: {pwd}")
            password_found = True
            break
    if not password_found:
        print(f"  -> Could not guess password for {admin.email} from common list.")
