// backend/ROUTES/payment.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    initiatePayment,
    getPaymentById,
    getPaymentsByOrder,
    getMyPayments,
    getPaymentStatus,
    verifyPayment,
    processRefund,
    retryPayment,
    getPaymentMethods,
    updatePaymentMethod,
    createPaymentIntent,
    confirmPayment,
    webhookHandler,
    getAllPayments,
    getPaymentStats,
    getPaymentsByStatus,
    downloadPaymentReceipt
} from "../CONTROLLERS/payment.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get available payment methods
router.get("/methods", asyncWrap(getPaymentMethods));

// Webhook handler (for payment gateway callbacks)
router.post("/webhook", asyncWrap(webhookHandler));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// Create payment intent
router.post("/intent/create", asyncWrap(createPaymentIntent));

// Initiate payment
router.post("/", asyncWrap(initiatePayment));

// Confirm payment
router.post("/confirm", asyncWrap(confirmPayment));

// Get payment by ID
router.get("/:paymentId", asyncWrap(getPaymentById));

// Get my payments
router.get("/my-payments/list", asyncWrap(getMyPayments));

// Get payments by order
router.get("/order/:orderId", asyncWrap(getPaymentsByOrder));

// Get payment status
router.get("/:paymentId/status", asyncWrap(getPaymentStatus));

// Verify payment
router.post("/:paymentId/verify", asyncWrap(verifyPayment));

// Retry payment
router.post("/:paymentId/retry", asyncWrap(retryPayment));

// Download payment receipt
router.get("/:paymentId/receipt/download", asyncWrap(downloadPaymentReceipt));

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Update payment method
router.put(
    "/:paymentId/method",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updatePaymentMethod)
);

// Process refund
router.post(
    "/:paymentId/refund",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(processRefund)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all payments
router.get(
    "/admin/payments/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllPayments)
);

// Get payments by status
router.get(
    "/admin/payments/status/:status",
    authorizeRoles("ADMIN"),
    asyncWrap(getPaymentsByStatus)
);

// Get payment statistics
router.get(
    "/admin/payments/stats",
    authorizeRoles("ADMIN"),
    asyncWrap(getPaymentStats)
);

export default router;
