import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

import { calculateDeliveryCharge, calculateOrderTotal } from '../utils/orderUtils.js';

// @desc    Initiate Payment (Create DB Order + Razorpay Order)
// @route   POST /api/payment/initiate
// @access  Private
const initiatePayment = asyncHandler(async (req, res) => {
    const { items, totalAmount, customerName, contactNumber, address, flatBuilding, floorUnit, pincode, location, latitude, longitude } = req.body;

    const { itemsTotal, formattedItems } = await calculateOrderTotal(items);
    const { deliveryCharge, distance, estimatedDeliveryTime } = await calculateDeliveryCharge(latitude, longitude);
    
    // Calculate final total using DB prices + delivery charge
    const finalTotalAmount = itemsTotal + deliveryCharge;

    // 1. Create DB Order (Pending)
    const newOrder = new Order({
        user: req.user._id,
        items: formattedItems,
        totalAmount: finalTotalAmount,
        customerName,
        contactNumber,
        address,
        flatBuilding,
        floorUnit,
        pincode,
        location,
        latitude,
        longitude,
        deliveryCharge,
        distance,
        estimatedDeliveryTime,
        paymentMethod: 'Online',
        paymentStatus: 'Pending',
        status: 'Pending'
    });
    await newOrder.save();

    // 2. Create Razorpay Order
    const options = {
        amount: Math.round(finalTotalAmount * 100),
        currency: 'INR',
        receipt: `receipt_${newOrder._id}`,
        notes: {
            orderId: newOrder._id.toString()
        }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 3. Update DB Order with Razorpay Order ID
    newOrder.paymentDetails = {
        razorpay_order_id: razorpayOrder.id
    };
    await newOrder.save();

    res.json({
        orderId: newOrder._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
    });
});

// @desc    Verify Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        // Update Order
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed'; // Auto-confirm on successful payment
        order.paymentDetails = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        };
        await order.save();
        
        // Notify Admin
         if (req.io) {
            req.io.emit('newOrder', order);
        }

        res.json({ success: true, order });
    } else {
        res.status(400);
        throw new Error('Invalid signature');
    }
});

export { initiatePayment, verifyPayment };
