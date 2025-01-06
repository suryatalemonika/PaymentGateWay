const express = require('express');
const razorpay = require('razorpay');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Razorpay instance setup
const instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order API
app.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // amount in INR

        // Create a Razorpay order
        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: "rcptid_11",
            payment_capture: 1, // Auto capture
        };

        const order = await instance.orders.create(options);
        res.json({
            id: order.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating Razorpay order");
    }
});

// Verify Payment API
app.post('/verify-payment', async (req, res) => {
    const { payment_id, order_id, signature } = req.body;

    const body = `${order_id}|${payment_id}`;
    const expected_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expected_signature === signature) {
        res.status(200).json({ message: 'Payment verified successfully' });
    } else {
        res.status(400).json({ message: 'Payment verification failed' });
    }
});

// Serve a simple HTML page for frontend payment
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Razorpay Payment</title>
    </head>
    <body>
        <h2>Razorpay Payment Gateway Integration</h2>
        <button id="payButton">Pay Now</button>

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
            document.getElementById('payButton').onclick = async function () {
                // Request backend to create an order
                const response = await fetch('/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount: 1 }), // Example: amount = 1 INR
                });

                const data = await response.json();
                const options = {
                    key: '${process.env.RAZORPAY_KEY_ID}',  // Your Razorpay key ID
                    amount: 5, // Amount in paise (500 INR)
                    currency: 'INR',
                    name: 'Your Company Name',
                    description: 'Payment for product/service',
                    order_id: data.id, // The order ID created by backend
                    handler: function (response) {
                        // Payment success handler
                        fetch('/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                payment_id: response.razorpay_payment_id,
                                order_id: response.razorpay_order_id,
                                signature: response.razorpay_signature,
                            }),
                        })
                        .then(res => res.json())
                        .then(data => alert('Payment verified successfully'))
                        .catch(err => alert('Payment verification failed'));
                    },
                    prefill: {
                        name: 'John Doe',
                        email: 'john@example.com',
                        contact: '9876543210',
                    },
                    theme: {
                        color: '#F37254',
                    },
                };

                const razorpayPaymentWindow = new Razorpay(options);
                razorpayPaymentWindow.open();
            };
        </script>
    </body>
    </html>
    `);
});

// Set up server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
