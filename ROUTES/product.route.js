import { Router } from "express";
import asyncWrap from "../UTILS/asyncwrap.js";
import { isLoggedIn, authorizeRoles } from "../MIDDLEWARES/auth.middleware.js";
import {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    toggleFeatured,
    toggleTrending,
    getProductsByCategory,
    getProductsBySeller,
    searchProducts,
    getProductStats,
    uploadProductImages,
    deleteProductImage,
    updateProductPrice,
    updateProductStock,
    getRelatedProducts,
    filterProducts,
    getFeaturedProducts,
    getTrendingProducts,
    addProductReview,
    getProductReviews,
    rateProduct
} from "../CONTROLLERS/product.controller.js";
import upload from "../MIDDLEWARES/multer.middleware.js";

const router = Router();

// ============================================
// PUBLIC GET ROUTES (No authentication)
// ============================================

// Get all products with pagination
router.get("/", asyncWrap(getProducts));

// Get featured products
router.get("/featured/list", asyncWrap(getFeaturedProducts));

// Get trending products
router.get("/trending/list", asyncWrap(getTrendingProducts));

// Filter products
router.post("/filter", asyncWrap(filterProducts));

// Search products
router.get("/search", asyncWrap(searchProducts));

// Get products by category
router.get("/category/:categoryId", asyncWrap(getProductsByCategory));

// Get products by seller
router.get("/seller/:sellerId", asyncWrap(getProductsBySeller));

// Get product reviews
router.get("/:productId/reviews", asyncWrap(getProductReviews));

// Get related products
router.get("/:productId/related", asyncWrap(getRelatedProducts));

// Get product statistics
router.get("/:productId/stats", asyncWrap(getProductStats));

// Get product by slug
router.get("/slug/:slug", asyncWrap(getProductBySlug));

// Get product by ID (LEAST SPECIFIC - PLACE LAST)
router.get("/:productId", asyncWrap(getProductById));

// ============================================
// PROTECTED POST ROUTES (Authentication required)
// ============================================

// Add product review
router.post(
    "/:productId/reviews",
    isLoggedIn,
    asyncWrap(addProductReview)
);

// Rate product
router.post(
    "/:productId/rate",
    isLoggedIn,
    asyncWrap(rateProduct)
);

// ============================================
// SELLER ROUTES (SELLER/ADMIN role required)
// ============================================

// ✅ CREATE PRODUCT WITH UPLOAD
router.post(
    "/",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(createProduct)
);

// Update product
router.put(
    "/:productId",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateProduct)
);

// Update product price
router.patch(
    "/:productId/price",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateProductPrice)
);

// Update product stock
router.patch(
    "/:productId/stock",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(updateProductStock)
);

// Upload product images
router.post(
    "/:productId/images/upload",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    upload.array('images', 5),
    asyncWrap(uploadProductImages)
);

// Delete product image
router.delete(
    "/:productId/images/:imageId",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(deleteProductImage)
);

// Delete product
router.delete(
    "/:productId",
    isLoggedIn,
    authorizeRoles("SELLER", "ADMIN"),
    asyncWrap(deleteProduct)
);

// ============================================
// ADMIN ROUTES (ADMIN role required)
// ============================================

// Toggle featured
router.patch(
    "/:productId/toggle-featured",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(toggleFeatured)
);

// Toggle trending
router.patch(
    "/:productId/toggle-trending",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(toggleTrending)
);

// Toggle product active
router.patch(
    "/:productId/toggle-active",
    isLoggedIn,
    authorizeRoles("ADMIN"),
    asyncWrap(toggleProductActive)
);

export default router;
