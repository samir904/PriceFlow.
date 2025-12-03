// backend/ROUTES/category.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

import {
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    getSubcategories,
    getCategoryStats,
    searchCategories
} from "../CONTROLLERS/category.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all active categories
router.get("/", asyncWrap(getCategories));

// Get category by ID
router.get("/:categoryId", asyncWrap(getCategoryById));

// Get category by slug
router.get("/slug/:slug", asyncWrap(getCategoryBySlug));

// Get subcategories
router.get("/:categoryId/subcategories", asyncWrap(getSubcategories));

// Search categories
router.get("/search/query", asyncWrap(searchCategories));

// Get category statistics
router.get("/:categoryId/stats", asyncWrap(getCategoryStats));

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

// Create category
router.post(
    "/",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(createCategory)
);

// Update category
router.put(
    "/:categoryId",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(updateCategory)
);

// Delete category
router.delete(
    "/:categoryId",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(deleteCategory)
);

// Toggle category active status
router.patch(
    "/:categoryId/toggle-active",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(toggleCategoryActive)
);

export default router;
