// backend/ROUTES/order.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createOrder,
    getOrderById,
    getMyOrders,
    updateOrderStatus,
    cancelOrder,
    updateShippingAddress,
    trackOrder,
    requestReturn,
    approveReturn,
    rejectReturn,
    getOrderStats,
    generateInvoice,
    downloadInvoice,
    addOrderNote,
    getOrderByNumber,
    getAllOrders,
    getOrdersByStatus,
    getOrdersByDateRange
} from "../CONTROLLERS/order.controller.js";

const router = Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// Create order
router.post("/", asyncWrap(createOrder));

// Get my orders
router.get("/my-orders/list", asyncWrap(getMyOrders));

// Get order by ID
router.get("/:orderId", asyncWrap(getOrderById));

// Get order by order number
router.get("/number/:orderNumber", asyncWrap(getOrderByNumber));

// Track order
router.get("/:orderId/track", asyncWrap(trackOrder));

// Update shipping address
router.put("/:orderId/shipping-address", asyncWrap(updateShippingAddress));

// Request return
router.post("/:orderId/request-return", asyncWrap(requestReturn));

// Generate invoice
router.get("/:orderId/invoice/generate", asyncWrap(generateInvoice));

// Download invoice
router.get("/:orderId/invoice/download", asyncWrap(downloadInvoice));

// Add order note
router.post("/:orderId/notes", asyncWrap(addOrderNote));

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Cancel order
router.post(
    "/:orderId/cancel",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(cancelOrder)
);

// Update order status
router.patch(
    "/:orderId/status",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateOrderStatus)
);

// Approve return
router.post(
    "/:orderId/return/approve",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(approveReturn)
);

// Reject return
router.post(
    "/:orderId/return/reject",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(rejectReturn)
);

// Get order statistics
router.get(
    "/:orderId/stats",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getOrderStats)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all orders
router.get(
    "/admin/orders/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllOrders)
);

// Get orders by status
router.get(
    "/admin/orders/status/:status",
    authorizeRoles("ADMIN"),
    asyncWrap(getOrdersByStatus)
);

// Get orders by date range
router.post(
    "/admin/orders/date-range",
    authorizeRoles("ADMIN"),
    asyncWrap(getOrdersByDateRange)
);

export default router;
