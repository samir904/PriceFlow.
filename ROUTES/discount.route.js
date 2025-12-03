// backend/ROUTES/discount.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createDiscount,
    getDiscountById,
    getDiscountByCode,
    updateDiscount,
    deleteDiscount,
    validateDiscount,
    applyDiscount,
    getActiveDiscounts,
    getMyDiscounts,
    toggleDiscountActive,
    getDiscountStats,
    getDiscountUsage,
    addCustomersToDiscount,
    removeCustomersFromDiscount,
    getAllDiscounts,
    getDiscountsByType,
    getExpiringDiscounts,
    getDiscountReport
} from "../CONTROLLERS/discount.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get active discounts
router.get("/active", asyncWrap(getActiveDiscounts));

// Validate discount code
router.post("/validate", asyncWrap(validateDiscount));

// Get discount by code
router.get("/code/:code", asyncWrap(getDiscountByCode));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// Apply discount
router.post("/:discountId/apply", asyncWrap(applyDiscount));

// Get my discounts (for sellers)
router.get("/my-discounts/list", asyncWrap(getMyDiscounts));

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Create discount
router.post(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(createDiscount)
);

// Get discount by ID
router.get(
    "/:discountId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getDiscountById)
);

// Update discount
router.put(
    "/:discountId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateDiscount)
);

// Delete discount
router.delete(
    "/:discountId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(deleteDiscount)
);

// Toggle discount active
router.patch(
    "/:discountId/toggle-active",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(toggleDiscountActive)
);

// Get discount statistics
router.get(
    "/:discountId/stats",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getDiscountStats)
);

// Get discount usage
router.get(
    "/:discountId/usage",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getDiscountUsage)
);

// Add customers to discount
router.post(
    "/:discountId/customers/add",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(addCustomersToDiscount)
);

// Remove customers from discount
router.post(
    "/:discountId/customers/remove",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(removeCustomersFromDiscount)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all discounts
router.get(
    "/admin/discounts/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllDiscounts)
);

// Get discounts by type
router.get(
    "/admin/discounts/type/:type",
    authorizeRoles("ADMIN"),
    asyncWrap(getDiscountsByType)
);

// Get expiring discounts
router.get(
    "/admin/discounts/expiring",
    authorizeRoles("ADMIN"),
    asyncWrap(getExpiringDiscounts)
);

// Get discount report
router.get(
    "/admin/discounts/report",
    authorizeRoles("ADMIN"),
    asyncWrap(getDiscountReport)
);

export default router;
