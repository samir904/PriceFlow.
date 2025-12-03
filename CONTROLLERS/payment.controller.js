// backend/CONTROLLERS/payment.controller.js

import Payment from "../MODELS/payment.model.js";
import Order from "../MODELS/order.model.js";
import crypto from "crypto";

// ============================================
// INITIATE PAYMENT
// ============================================
export const initiatePayment = async (req, res, next) => {
    try {
        const { orderId, amount, paymentMethod } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: "Order ID and amount are required"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Create payment record
        const payment = await Payment.create({
            order: orderId,
            customer: req.user.id,
            amount,
            method: paymentMethod || "razorpay",
            status: "pending"
        });

        // TODO: Initialize Razorpay payment
        // For now, return payment details
        
        return res.status(201).json({
            success: true,
            message: "Payment initiated",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CREATE PAYMENT INTENT (For Razorpay)
// ============================================
export const createPaymentIntent = async (req, res, next) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({
                success: false,
                message: "Order ID and amount required"
            });
        }

        // TODO: Implement Razorpay order creation
        // const razorpayOrder = await razorpay.orders.create({
        //     amount: amount * 100, // in paise
        //     currency: "INR",
        //     receipt: orderId
        // });

        return res.status(201).json({
            success: true,
            message: "Payment intent created",
            // razorpayOrderId: razorpayOrder.id,
            amount,
            orderId
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// VERIFY PAYMENT
// ============================================
export const verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // TODO: Verify Razorpay signature
        // const generated_signature = crypto
        //     .createHmac("sha256", process.env.RAZORPAY_SECRET)
        //     .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        //     .digest("hex");

        // if (generated_signature !== razorpaySignature) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Payment verification failed"
        //     });
        // }

        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpayOrderId = razorpayOrderId;
        payment.status = "completed";
        payment.paidAt = new Date();
        await payment.save();

        // Update order status
        const order = await Order.findByIdAndUpdate(
            payment.order,
            { "payment.status": "completed" },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CONFIRM PAYMENT
// ============================================
export const confirmPayment = async (req, res, next) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        const payment = await Payment.findOne({ 
            razorpayOrderId 
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        payment.status = "confirmed";
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment confirmed",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT BY ID
// ============================================
export const getPaymentById = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate("order")
            .populate("customer", "fullName email");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        return res.status(200).json({
            success: true,
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENTS BY ORDER
// ============================================
export const getPaymentsByOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const payments = await Payment.find({ order: orderId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            payments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET MY PAYMENTS
// ============================================
export const getMyPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const payments = await Payment.find({ customer: req.user.id })
            .populate("order", "orderNumber")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Payment.countDocuments({ customer: req.user.id });

        return res.status(200).json({
            success: true,
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT STATUS
// ============================================
export const getPaymentStatus = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        return res.status(200).json({
            success: true,
            status: payment.status,
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// RETRY PAYMENT
// ============================================
export const retryPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        payment.status = "pending";
        payment.attempts = (payment.attempts || 0) + 1;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment retry initiated",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PROCESS REFUND
// ============================================
export const processRefund = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        if (payment.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Can only refund completed payments"
            });
        }

        // TODO: Implement Razorpay refund
        // const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        //     amount: payment.amount * 100,
        //     notes: {
        //         reason
        //     }
        // });

        payment.status = "refunded";
        payment.refundedAt = new Date();
        payment.refundReason = reason;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT METHODS
// ============================================
export const getPaymentMethods = async (req, res, next) => {
    try {
        const methods = [
            { id: "razorpay", name: "Razorpay", enabled: true },
            { id: "cod", name: "Cash on Delivery", enabled: true },
            { id: "bank_transfer", name: "Bank Transfer", enabled: true }
        ];

        return res.status(200).json({
            success: true,
            methods
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PAYMENT METHOD
// ============================================
export const updatePaymentMethod = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const { method } = req.body;

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        payment.method = method;
        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment method updated",
            payment
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DOWNLOAD PAYMENT RECEIPT
// ============================================
export const downloadPaymentReceipt = async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)
            .populate("order")
            .populate("customer", "fullName email");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // TODO: Generate PDF receipt

        return res.status(200).json({
            success: true,
            message: "Receipt download started"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// WEBHOOK HANDLER (Razorpay)
// ============================================
export const webhookHandler = async (req, res, next) => {
    try {
        const { event } = req.body;

        if (event === "payment.authorized") {
            const { payload } = req.body;
            const payment = await Payment.findOne({
                razorpayPaymentId: payload.payment.entity.id
            });

            if (payment) {
                payment.status = "completed";
                payment.paidAt = new Date();
                await payment.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Webhook processed"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL PAYMENTS (Admin)
// ============================================
export const getAllPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const payments = await Payment.find()
            .populate("customer", "fullName email")
            .populate("order", "orderNumber")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Payment.countDocuments();

        return res.status(200).json({
            success: true,
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENTS BY STATUS (Admin)
// ============================================
export const getPaymentsByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const payments = await Payment.find({ status })
            .populate("customer", "fullName")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Payment.countDocuments({ status });

        return res.status(200).json({
            success: true,
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT STATS (Admin)
// ============================================
export const getPaymentStats = async (req, res, next) => {
    try {
        const totalPayments = await Payment.countDocuments();
        const completedPayments = await Payment.countDocuments({ status: "completed" });
        const pendingPayments = await Payment.countDocuments({ status: "pending" });
        const refundedPayments = await Payment.countDocuments({ status: "refunded" });

        const totalAmount = await Payment.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const stats = {
            totalPayments,
            completedPayments,
            pendingPayments,
            refundedPayments,
            totalAmount: totalAmount[0]?.total || 0
        };

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
