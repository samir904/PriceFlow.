// backend/ROUTES/report.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createSalesReport,
    getReports,
    getReportById,
    updateReport,
    deleteReport,
    generateReport,
    getSalesReport,
    getRevenueReport,
    getCustomerReport,
    getProductReport,
    getInventoryReport,
    getPricingReport,
    getPaymentReport,
    getComprehensiveReport,
    archiveReport,
    downloadReport,
    exportReport,
    getReportsByPeriod,
    getReportsByType,
    getReportStats,
    scheduleReport,
    getScheduledReports,
    getAllReports,
    generateCustomReport
} from "../CONTROLLERS/report.controller.js";

const router = Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(isLoggedIn);

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Create sales report
router.post(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(createSalesReport)
);

// Get reports
router.get(
    "/",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getReports)
);

// Get report by ID
router.get(
    "/:reportId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getReportById)
);

// Update report
router.put(
    "/:reportId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateReport)
);

// Delete report
router.delete(
    "/:reportId",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(deleteReport)
);

// Generate report
router.post(
    "/generate/create",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(generateReport)
);

// Get sales report
router.get(
    "/type/sales",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getSalesReport)
);

// Get revenue report
router.get(
    "/type/revenue",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getRevenueReport)
);

// Get customer report
router.get(
    "/type/customer",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getCustomerReport)
);

// Get product report
router.get(
    "/type/product",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getProductReport)
);

// Get inventory report
router.get(
    "/type/inventory",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getInventoryReport)
);

// Get pricing report
router.get(
    "/type/pricing",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPricingReport)
);

// Get payment report
router.get(
    "/type/payment",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getPaymentReport)
);

// Get comprehensive report
router.get(
    "/type/comprehensive",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getComprehensiveReport)
);

// Archive report
router.patch(
    "/:reportId/archive",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(archiveReport)
);

// Download report
router.get(
    "/:reportId/download",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(downloadReport)
);

// Export report
router.get(
    "/:reportId/export/:format",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(exportReport)
);

// Get reports by period
router.post(
    "/filter/period",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getReportsByPeriod)
);

// Get report statistics
router.get(
    "/:reportId/stats",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getReportStats)
);

// Schedule report
router.post(
    "/schedule/create",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(scheduleReport)
);

// Get scheduled reports
router.get(
    "/schedule/list",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(getScheduledReports)
);

// Generate custom report
router.post(
    "/custom/generate",
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(generateCustomReport)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all reports
router.get(
    "/admin/reports/all",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllReports)
);

// Get reports by type
router.get(
    "/admin/reports/type/:type",
    authorizeRoles("ADMIN"),
    asyncWrap(getReportsByType)
);

export default router;
