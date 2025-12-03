// backend/ROUTES/analytics.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createAnalytics,
    getAnalytics,
    getAnalyticsByDate,
    getAnalyticsByProduct,
    getAnalyticsByCategory,
    getSalesAnalytics,
    getCustomerAnalytics,
    getInventoryAnalytics,
    getTrafficAnalytics,
    getPaymentAnalytics,
    getPricingAnalytics,
    getCompetitorAnalysis,
    getTrendAnalysis,
    getSummaryAnalytics,
    generateAnalyticsReport,
    getTopProducts,
    getTopCategories,
    getCustomerSegmentation,
    getRevenueAnalytics,
    getProfitAnalytics,
    getDateRangeAnalytics,
    exportAnalytics
} from "../CONTROLLERS/analytics.controller.js";

const router = Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Get analytics by product
router.get(
    "/product/:productId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getAnalyticsByProduct)
);

// Get sales analytics
router.get(
    "/dashboard/sales",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getSalesAnalytics)
);

// Get revenue analytics
router.get(
    "/dashboard/revenue",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getRevenueAnalytics)
);

// Get profit analytics
router.get(
    "/dashboard/profit",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getProfitAnalytics)
);

// Get customer analytics
router.get(
    "/dashboard/customers",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getCustomerAnalytics)
);

// Get inventory analytics
router.get(
    "/dashboard/inventory",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getInventoryAnalytics)
);

// Get traffic analytics
router.get(
    "/dashboard/traffic",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getTrafficAnalytics)
);

// Get payment analytics
router.get(
    "/dashboard/payments",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPaymentAnalytics)
);

// Get pricing analytics
router.get(
    "/dashboard/pricing",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPricingAnalytics)
);

// Get top products
router.get(
    "/products/top",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getTopProducts)
);

// Get competitor analysis
router.get(
    "/market/competitor-analysis",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getCompetitorAnalysis)
);

// Get trend analysis
router.get(
    "/market/trends",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getTrendAnalysis)
);

// Get summary analytics
router.get(
    "/dashboard/summary",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getSummaryAnalytics)
);

// Generate analytics report
router.post(
    "/report/generate",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(generateAnalyticsReport)
);

// Export analytics
router.get(
    "/export/:format",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(exportAnalytics)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Create analytics
router.post(
    "/",
    authorizeRoles("ADMIN"),
    asyncWrap(createAnalytics)
);

// Get all analytics
router.get(
    "/admin/analytics",
    authorizeRoles("ADMIN"),
    asyncWrap(getAnalytics)
);

// Get analytics by date
router.post(
    "/admin/analytics/date-range",
    authorizeRoles("ADMIN"),
    asyncWrap(getDateRangeAnalytics)
);

// Get analytics by date
router.get(
    "/admin/analytics/by-date/:date",
    authorizeRoles("ADMIN"),
    asyncWrap(getAnalyticsByDate)
);

// Get analytics by category
router.get(
    "/admin/analytics/category/:categoryId",
    authorizeRoles("ADMIN"),
    asyncWrap(getAnalyticsByCategory)
);

// Get top categories
router.get(
    "/admin/categories/top",
    authorizeRoles("ADMIN"),
    asyncWrap(getTopCategories)
);

// Get customer segmentation
router.get(
    "/admin/customers/segmentation",
    authorizeRoles("ADMIN"),
    asyncWrap(getCustomerSegmentation)
);

export default router;
