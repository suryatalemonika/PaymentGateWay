const axios = require("axios");

// Replace these with your Razorpay Key ID and Key Secret
const razorpayKeyId = "rzp_test_2ujc0PSYqoRfvh";
const razorpayKeySecret = "iZSECMxt6e0lgikXggymTkUF";

// Basic Auth for Razorpay
const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");

// Razorpay Order API Endpoint
const razorpayOrderUrl = "http://localhost:3000/create-order";

// Order Details
const orderData = {
    amount: 50000, // Amount in smallest currency unit (e.g., 50000 paise = ₹500)
    currency: "INR",
    receipt: "order_rcptid_11",
    notes: {
        description: "Test Order for Razorpay Integration",
    },
};

// Create an Order
axios
    .post(razorpayOrderUrl, orderData, {
        headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
        },
    })
    .then((response) => {
        console.log("Order Created Successfully:", response.data);
    })
    .catch((error) => {
        console.error("Error Creating Order:", error.response.data);
    });
