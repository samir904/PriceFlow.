// backend/ROUTES/pricing.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createPricingStrategy,
    getPricingStrategies,
    getPricingStrategyById,
    updatePricingStrategy,
    deletePricingStrategy,
    toggleStrategyActive,
    getPricingStrategyByProduct,
    getStrategiesByType,
    applyPricingStrategy,
    calculatePrice,
    getActiveStrategies,
    getDynamicPrice,
    getSeasonalPrice,
    getTieredPrice,
    getPsychologicalPrice,
    getCompetitivePrice,
    getPricingMetrics,
    getStrategyPerformance,
    optimizePrice,
    getAllStrategies,
    getPriceHistory,
    simulatePricing,
    compareStrategies
} from "../CONTROLLERS/pricing.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Calculate price for product
router.post("/calculate", asyncWrap(calculatePrice));

// Get competitive price
router.get("/competitive/:productId", asyncWrap(getCompetitivePrice));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// Get pricing strategy by product
router.get(
    "/product/:productId",
    asyncWrap(getPricingStrategyByProduct)
);

// Get dynamic price for product
router.get(
    "/:productId/dynamic",
    asyncWrap(getDynamicPrice)
);

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Create pricing strategy
router.post(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(createPricingStrategy)
);

// Get pricing strategies
router.get(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPricingStrategies)
);

// Get pricing strategy by ID
router.get(
    "/:strategyId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPricingStrategyById)
);

// Update pricing strategy
router.put(
    "/:strategyId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updatePricingStrategy)
);

// Delete pricing strategy
router.delete(
    "/:strategyId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(deletePricingStrategy)
);

// Toggle strategy active
router.patch(
    "/:strategyId/toggle-active",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(toggleStrategyActive)
);

// Apply pricing strategy
router.post(
    "/:strategyId/apply",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(applyPricingStrategy)
);

// Get active strategies
router.get(
    "/dashboard/active",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getActiveStrategies)
);

// Get strategies by type
router.get(
    "/type/:type",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getStrategiesByType)
);

// Get tiered price
router.post(
    "/:productId/tiered",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getTieredPrice)
);

// Get seasonal price
router.post(
    "/:productId/seasonal",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getSeasonalPrice)
);

// Get psychological price
router.post(
    "/:productId/psychological",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPsychologicalPrice)
);

// Get pricing metrics
router.get(
    "/:strategyId/metrics",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPricingMetrics)
);

// Get strategy performance
router.get(
    "/:strategyId/performance",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getStrategyPerformance)
);

// Optimize price
router.post(
    "/:productId/optimize",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(optimizePrice)
);

// Simulate pricing
router.post(
    "/simulate/impact",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(simulatePricing)
);

// Get price history
router.get(
    "/:productId/history",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPriceHistory)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all strategies
router.get(
    "/admin/strategies/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllStrategies)
);

// Compare strategies
router.post(
    "/admin/strategies/compare",
    authorizeRoles("ADMIN"),
    asyncWrap(compareStrategies)
);

export default router;
