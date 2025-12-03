// backend/ROUTES/inventory.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock,
    addStock,
    removeStock,
    getStockMovements,
    performPhysicalCount,
    generateStockReport,
    getLowStockProducts,
    getOutOfStockProducts,
    getOverStockProducts,
    updateReorderSettings,
    getInventoryStats,
    getInventoryByWarehouse,
    transferStock,
    adjustStock,
    getSlowMovingProducts,
    getFastMovingProducts,
    getAllInventory,
    getInventoryAlerts
} from "../CONTROLLERS/inventory.controller.js";

const router = Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// Get inventory by product
router.get("/:productId", asyncWrap(getInventoryByProduct));

// Get inventory statistics
router.get(
    "/:productId/stats",
    asyncWrap(getInventoryStats)
);

// Get stock movements
router.get(
    "/:productId/movements",
    asyncWrap(getStockMovements)
);

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Create inventory
router.post(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(createInventory)
);

// Update stock
router.patch(
    "/:productId/stock/update",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateStock)
);

// Add stock
router.post(
    "/:productId/stock/add",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(addStock)
);

// Remove stock
router.post(
    "/:productId/stock/remove",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(removeStock)
);

// Adjust stock
router.post(
    "/:productId/stock/adjust",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(adjustStock)
);

// Update reorder settings
router.put(
    "/:productId/reorder-settings",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateReorderSettings)
);

// Transfer stock between warehouses
router.post(
    "/:productId/transfer",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(transferStock)
);

// Perform physical count
router.post(
    "/:productId/physical-count",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(performPhysicalCount)
);

// Generate stock report
router.get(
    "/:productId/report",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(generateStockReport)
);

// Get inventory alerts
router.get(
    "/:productId/alerts",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getInventoryAlerts)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all inventory
router.get(
    "/admin/inventory/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllInventory)
);

// Get inventory
router.get(
    "/admin/inventory",
    authorizeRoles("ADMIN"),
    asyncWrap(getInventory)
);

// Get low stock products
router.get(
    "/admin/inventory/low-stock",
    authorizeRoles("ADMIN"),
    asyncWrap(getLowStockProducts)
);

// Get out of stock products
router.get(
    "/admin/inventory/out-of-stock",
    authorizeRoles("ADMIN"),
    asyncWrap(getOutOfStockProducts)
);

// Get over stock products
router.get(
    "/admin/inventory/over-stock",
    authorizeRoles("ADMIN"),
    asyncWrap(getOverStockProducts)
);

// Get inventory by warehouse
router.get(
    "/admin/inventory/warehouse/:warehouseId",
    authorizeRoles("ADMIN"),
    asyncWrap(getInventoryByWarehouse)
);

// Get slow moving products
router.get(
    "/admin/inventory/slow-moving",
    authorizeRoles("ADMIN"),
    asyncWrap(getSlowMovingProducts)
);

// Get fast moving products
router.get(
    "/admin/inventory/fast-moving",
    authorizeRoles("ADMIN"),
    asyncWrap(getFastMovingProducts)
);

export default router;
