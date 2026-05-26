import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const PaymentPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);

    useEffect(() => {
        // Fetch booking details to get amount
        // ideally endpoint /bookings/:id
        // for now mock or fetch all and find
        const fetchBooking = async () => {
            // Mocking fetching single booking
            // In real app, create get_booking endpoint
            // setBooking({ id: bookingId, total_amount: 500 }); 
        };
        fetchBooking();
    }, [bookingId]);

    const handlePayment = async () => {
        const amount = 500; // Mock amount
        try {
            // 1. Create Order
            const orderRes = await api.post(`/payments/create-order?amount=${amount}`);
            const order = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: "YOUR_KEY_ID", // Enter the Key ID generated from the Dashboard
                amount: order.amount,
                currency: order.currency,
                name: "MediCare",
                description: "Care Service Payment",
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    await api.post('/payments/verify', {
                        payment_id: response.razorpay_payment_id,
                        order_id: response.razorpay_order_id,
                        signature: response.razorpay_signature
                    });
                    alert("Payment Successful!");
                    navigate('/user/dashboard');
                },
                prefill: {
                    name: "User Name",
                    email: "user@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#0d9488"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            console.error("Payment Error", err);
            alert("Something went wrong with payment initialization.");
        }
    };

    return (
        <Layout role="user">
            <h1 className="text-xl mb-6">Payment Details</h1>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💳</div>
                    <h3 className="text-lg mb-2">Booking #{bookingId}</h3>
                    <p className="text-muted mb-6">Complete your payment to confirm the service.</p>

                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>Service Charge</span>
                            <span>₹500.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>₹500.00</span>
                        </div>
                    </div>

                    <button className="btn btn-primary" onClick={handlePayment} style={{ width: '100%', padding: '15px', fontSize: '1.1rem' }}>
                        Pay Now via Razorpay
                    </button>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', color: '#94a3b8' }}>
                        <span>🔒 Secure Payment</span>
                        <span>•</span>
                        <span>✅ Verified</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentPage;
