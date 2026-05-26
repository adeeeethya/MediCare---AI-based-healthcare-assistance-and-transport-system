from fastapi import APIRouter, Depends
import razorpay
import schemas

router = APIRouter(
    prefix="/payments",
    tags=["payments"]
)

# Initialize Razorpay client (use env vars in production)
client = razorpay.Client(auth=("YOUR_KEY_ID", "YOUR_KEY_SECRET"))

@router.post("/create-order")
def create_payment_order(amount: float, currency: str = "INR"):
    data = { "amount": amount * 100, "currency": currency, "receipt": "order_rcptid_11" }
    payment = client.order.create(data=data)
    return payment

@router.post("/verify")
def verify_payment(payment_id: str, order_id: str, signature: str):
    # Verify signature
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return {"status": "success"}
    except:
        return {"status": "failure"}
