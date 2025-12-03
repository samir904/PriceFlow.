// backend/ROUTES/user.route.js

import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";

// Import all user controllers
import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    generateVerificationToken,
    enable2FA,
    verify2FA,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    addLoyaltyPoints,
    deductLoyaltyPoints,
    getLoyaltyBalance,
    updateBusinessProfile,
    getBusinessProfile,
    uploadVerificationDocuments,
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    updateUserRole,
    deleteUser
} from "../CONTROLLERS/user.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// User registration
router.post("/register", asyncWrap(register));

// User login
router.post("/login", asyncWrap(login));

// Forgot password
router.post("/forgot-password", asyncWrap(forgotPassword));

// Reset password
router.post("/reset-password/:resetToken", asyncWrap(resetPassword));

// Email verification
router.post("/verify-email/:verificationToken", asyncWrap(verifyEmail));

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Apply authentication middleware to all routes below
router.use(asyncWrap(isLoggedIn));

// Logout
router.post("/logout", asyncWrap(logout));

// Get current user profile
router.get("/profile", asyncWrap(getProfile));

// Update user profile
router.put("/profile", asyncWrap(updateProfile));

// Change password
router.post("/change-password", asyncWrap(changePassword));

// Generate verification token (to re-send verification email)
router.post("/generate-verification-token", asyncWrap(generateVerificationToken));

// ============================================
// WISHLIST ROUTES
// ============================================

// Add to wishlist
router.post("/wishlist/add/:productId", asyncWrap(addToWishlist));

// Remove from wishlist
router.delete("/wishlist/remove/:productId", asyncWrap(removeFromWishlist));

// Get wishlist
router.get("/wishlist", asyncWrap(getWishlist));

// ============================================
// LOYALTY ROUTES
// ============================================

// Get loyalty balance
router.get("/loyalty/balance", asyncWrap(getLoyaltyBalance));

// ============================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ============================================

// Enable 2FA
router.post("/2fa/enable", asyncWrap(enable2FA));

// Verify 2FA
router.post("/2fa/verify", asyncWrap(verify2FA));

// ============================================
// SELLER ROUTES (SELLER role required)
// ============================================

// Get business profile
router.get("/business-profile", authorizeRoles("SELLER"), asyncWrap(getBusinessProfile));

// Update business profile
router.put("/business-profile", authorizeRoles("SELLER"), asyncWrap(updateBusinessProfile));

// Upload verification documents
router.post(
    "/business-profile/upload-documents",
    authorizeRoles("SELLER"),
    asyncWrap(uploadVerificationDocuments)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Get all users
router.get(
    "/admin/users",
    authorizeRoles("ADMIN"),
    asyncWrap(getAllUsers)
);

// Get user by ID
router.get(
    "/admin/users/:userId",
    authorizeRoles("ADMIN"),
    asyncWrap(getUserById)
);

// Ban user
router.post(
    "/admin/users/:userId/ban",
    authorizeRoles("ADMIN"),
    asyncWrap(banUser)
);

// Unban user
router.post(
    "/admin/users/:userId/unban",
    authorizeRoles("ADMIN"),
    asyncWrap(unbanUser)
);

// Update user role
router.put(
    "/admin/users/:userId/role",
    authorizeRoles("ADMIN"),
    asyncWrap(updateUserRole)
);

// Delete user
router.delete(
    "/admin/users/:userId",
    authorizeRoles("ADMIN"),
    asyncWrap(deleteUser)
);

// Add loyalty points (admin)
router.post(
    "/admin/users/:userId/loyalty/add",
    authorizeRoles("ADMIN"),
    asyncWrap(addLoyaltyPoints)
);

// Deduct loyalty points (admin)
router.post(
    "/admin/users/:userId/loyalty/deduct",
    authorizeRoles("ADMIN"),
    asyncWrap(deductLoyaltyPoints)
);

export default router;
