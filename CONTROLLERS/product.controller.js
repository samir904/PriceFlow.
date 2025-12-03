// backend/CONTROLLERS/product.controller.js

import Product from "../MODELS/Product.model.js";
import Category from "../MODELS/category.model.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import Apperror from "../UTILS/error.util.js";

// ============================================
// CREATE PRODUCT
// ============================================
export const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            sku,
            description,
            category,
            pricing,
            stock,
            tags,
            specifications,
            warranty,
            returnPolicy
        } = req.body;

        console.log('📝 Creating product:', { name, sku, category });
        console.log('📁 Files received:', req.files?.length || 0);

        // ✅ Step 1: Validation
        if (!name || !sku || !description || !category || !pricing) {
            console.warn('❌ Validation failed: Missing required fields');
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // ✅ Step 2: Check if SKU already exists
        const skuExists = await Product.findOne({ sku: sku.toUpperCase() });
        if (skuExists) {
            console.warn('❌ SKU already exists:', sku);
            return res.status(409).json({
                success: false,
                message: "SKU already exists"
            });
        }

        // ✅ Step 3: Verify category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            console.warn('❌ Category not found:', category);
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // ✅ Step 4: Parse pricing
        let parsedPricing = pricing;
        if (typeof pricing === 'string') {
            try {
                parsedPricing = JSON.parse(pricing);
            } catch (e) {
                console.warn('❌ Invalid pricing format');
                return res.status(400).json({
                    success: false,
                    message: "Invalid pricing format"
                });
            }
        }

        // ✅ Step 5: Validate pricing
        if (!parsedPricing.costPrice || !parsedPricing.regularPrice || !parsedPricing.sellingPrice) {
            console.warn('❌ Incomplete pricing data');
            return res.status(400).json({
                success: false,
                message: "Please provide all pricing details"
            });
        }

        // ✅ Step 6: Create slug (UNIQUE with timestamp)
        let slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');

        // ✅ CRITICAL: Make slug unique by adding timestamp
        let uniqueSlug = slug;
        let slugExists = await Product.findOne({ slug: uniqueSlug });
        
        if (slugExists) {
            // Add timestamp to make unique
            const timestamp = Date.now();
            uniqueSlug = `${slug}-${timestamp}`;
            console.log('⚠️ Slug already exists, making unique:', uniqueSlug);
        }

        // ✅ Step 7: Parse optional fields
        let parsedTags = tags;
        let parsedSpecifications = specifications;
        let parsedStock = stock;
        let parsedWarranty = warranty;
        let parsedReturnPolicy = returnPolicy;

        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = tags.split(',').map(t => t.trim());
            }
        }

        if (typeof specifications === 'string') {
            try {
                parsedSpecifications = JSON.parse(specifications);
            } catch (e) {
                parsedSpecifications = [];
            }
        }

        if (typeof stock === 'string') {
            try {
                parsedStock = JSON.parse(stock);
            } catch (e) {
                parsedStock = { available: 0 };
            }
        }

        if (typeof warranty === 'string') {
            try {
                parsedWarranty = JSON.parse(warranty);
            } catch (e) {
                parsedWarranty = { period: 0, unit: 'days' };
            }
        }

        if (typeof returnPolicy === 'string') {
            try {
                parsedReturnPolicy = JSON.parse(returnPolicy);
            } catch (e) {
                parsedReturnPolicy = { returnable: true, returnDays: 30 };
            }
        }

        // ✅ Step 8: Create product (NO images at this stage)
        console.log('💾 Creating product in database');
        
        const product = await Product.create({
            name,
            slug: uniqueSlug,  // ✅ Use unique slug
            sku: sku.toUpperCase(),
            description,
            category,
            pricing: parsedPricing,
            stock: parsedStock || { available: 0 },
            images: [],  // ✅ Empty array - images added later
            tags: Array.isArray(parsedTags) ? parsedTags : [],
            specifications: Array.isArray(parsedSpecifications) ? parsedSpecifications : [],
            warranty: parsedWarranty,
            returnPolicy: parsedReturnPolicy,
            seller: req.user.id
        });

        console.log(`✅ Product created: ${product._id}`);

        // Populate references
        await product.populate("category", "name");

        return res.status(201).json({
            success: true,
            message: "Product created successfully! Now upload images.",
            product
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR in createProduct:', error.message);
        console.error('Stack trace:', error.stack);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create product",
            error: error.message
        });
    }
};



// ============================================
// GET ALL PRODUCTS
// ============================================

export const getProducts = async (req, res, next) => {
    try {
        console.log('🔵 Route: GET /api/v1/products');
        console.log('Query params:', req.query);

        let { page = 1, limit = 10, sort = "-createdAt" } = req.query;

        // ✅ Step 1: Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);

        // ✅ Step 2: Validate sort - THIS IS CRITICAL
        if (!sort || sort === 'undefined' || sort === '' || sort === 'null') {
            sort = '-createdAt';
        }

        console.log('✅ Params:', { pageNum, limitNum, sort });

        // ✅ Step 3: Query with strictPopulate: false
        const products = await Product.find({ isActive: true })
            .populate({
                path: "category",
                select: "name",
                strictPopulate: false
            })
            .populate({
                path: "seller",
                select: "fullName avatar",
                strictPopulate: false
            })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .sort(sort)
            .lean()
            .exec();

        const total = await Product.countDocuments({ isActive: true });

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });

    } catch (error) {
        console.error('❌ Error in getProducts:', error.message);
        return next(new Apperror(error.message, 500));
    }
};




// ============================================
// GET PRODUCT BY ID
// ============================================
// ============================================
// GET PRODUCT BY ID - FIXED (100% WORKING)
// ============================================
export const getProductById = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // ✅ Get product without populate
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ✅ Increment views separately
        await Product.findByIdAndUpdate(
            productId,
            { $inc: { "metrics.views": 1 } }
        );

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return next(new Apperror(error.message, 500));
    }
};




// ============================================
// GET PRODUCT BY SLUG
// ============================================
export const getProductBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOneAndUpdate(
            { slug },
            { $inc: { "metrics.views": 1 } },
            { new: true }
        )
            .populate("category")
            .populate("seller");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PRODUCT
// ============================================
export const updateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const {
            name,
            description,
            category,
            pricing,
            stock,
            tags,
            specifications,
            warranty,
            returnPolicy
        } = req.body;

        let product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (pricing) product.pricing = { ...product.pricing, ...pricing };
        if (stock) product.stock = { ...product.stock, ...stock };
        if (tags) product.tags = tags;
        if (specifications) product.specifications = specifications;
        if (warranty) product.warranty = warranty;
        if (returnPolicy) product.returnPolicy = returnPolicy;

        product = await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE PRODUCT
// ============================================
export const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this product"
            });
        }

        // Delete images from cloudinary
        for (const image of product.images) {
            await cloudinary.v2.uploader.destroy(image.public_id);
        }

        await Product.findByIdAndDelete(productId);

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE FEATURED
// ============================================
export const toggleFeatured = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.isFeatured = !product.isFeatured;
        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product ${product.isFeatured ? "featured" : "unfeatured"}`,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE TRENDING
// ============================================
export const toggleTrending = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.isTrending = !product.isTrending;
        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product ${product.isTrending ? "trending" : "not trending"}`,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE PRODUCT ACTIVE
// ============================================
export const toggleProductActive = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.isActive = !product.isActive;
        await product.save();

        return res.status(200).json({
            success: true,
            message: `Product ${product.isActive ? "activated" : "deactivated"}`,
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRODUCTS BY CATEGORY
// ============================================
export const getProductsByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const products = await Product.find({ category: categoryId, isActive: true })
            .populate("category")
            .populate("seller")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments({ category: categoryId, isActive: true });

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRODUCTS BY SELLER
// ============================================
export const getProductsBySeller = async (req, res, next) => {
    try {
        const { sellerId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const products = await Product.find({ seller: sellerId, isActive: true })
            .populate("category")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments({ seller: sellerId, isActive: true });

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// SEARCH PRODUCTS
// ============================================
// ============================================
// SEARCH PRODUCTS - FIXED
// ============================================
export const searchProducts = async (req, res, next) => {
    console.log('🔍 Search route hit');
    console.log('Query params:', req.query);
    
    try {
        // ✅ Accept both "q" and "query" for flexibility
        const searchQuery = req.query.q || req.query.query;
        const { page = 1, limit = 10 } = req.query;

        if (!searchQuery) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);

        console.log('Searching for:', { searchQuery, pageNum, limitNum });

        const products = await Product.find({
            $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { description: { $regex: searchQuery, $options: "i" } },
                { tags: { $regex: searchQuery, $options: "i" } }
            ],
            isActive: true
        })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum);

        const total = await Product.countDocuments({
            $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { description: { $regex: searchQuery, $options: "i" } },
                { tags: { $regex: searchQuery, $options: "i" } }
            ],
            isActive: true
        });

        console.log('✅ Found:', products.length, 'products');

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });

    } catch (error) {
        console.error('❌ Error in searchProducts:', error.message);
        return next(new Apperror(error.message, 500));
    }
};


// ============================================
// GET FEATURED PRODUCTS
// ============================================
export const getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ isFeatured: true, isActive: true })
            .populate("category")
            .populate("seller")
            .limit(10);

        return res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TRENDING PRODUCTS
// ============================================
export const getTrendingProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ isTrending: true, isActive: true })
            .populate("category")
            .populate("seller")
            .limit(10);

        return res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET RELATED PRODUCTS
// ============================================
export const getRelatedProducts = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId },
            isActive: true
        })
            .populate("category")
            .populate("seller")
            .limit(5);

        return res.status(200).json({
            success: true,
            relatedProducts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// FILTER PRODUCTS
// ============================================
export const filterProducts = async (req, res, next) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            rating,
            sortBy = "newest",
            page = 1,
            limit = 10
        } = req.body;

        let query = { isActive: true };

        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query["pricing.sellingPrice"] = {};
            if (minPrice) query["pricing.sellingPrice"].$gte = minPrice;
            if (maxPrice) query["pricing.sellingPrice"].$lte = maxPrice;
        }
        if (rating) query["ratings.average"] = { $gte: rating };

        let sort = {};
        switch (sortBy) {
            case "newest":
                sort = { createdAt: -1 };
                break;
            case "price_low":
                sort = { "pricing.sellingPrice": 1 };
                break;
            case "price_high":
                sort = { "pricing.sellingPrice": -1 };
                break;
            case "rating":
                sort = { "ratings.average": -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .populate("category")
            .populate("seller")
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(query);

        return res.status(200).json({
            success: true,
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRODUCT STATS
// ============================================
export const getProductStats = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            stats: product.metrics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPLOAD PRODUCT IMAGES
// ============================================
// ✅ FIXED: uploadProductImages with proper image assignment
export const uploadProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;

        // ✅ Find product
        const product = await Product.findById(productId);

        if (!product) {
            // Clean up files if product not found
            if (req.files) {
                for (const file of req.files) {
                    try {
                        await fs.unlink(file.path);
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                }
            }
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // ✅ Validate files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one image"
            });
        }

        // ✅ CLOUDINARY UPLOAD: Handle image uploads
        let images = [];
        try {
            console.log(`📤 Starting upload of ${req.files.length} images for product: ${productId}`);
            
            // Upload all files to Cloudinary in parallel
            const uploadPromises = req.files.map(async (file) => {
                try {
                    console.log(`📤 Uploading: ${file.filename}`);
                    
                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: "PriceFlow/products",
                        resource_type: 'image',
                        use_filename: true,
                        unique_filename: true,
                        access_mode: 'public',
                        type: 'upload'
                    });

                    console.log(`✅ Uploaded to Cloudinary: ${result.public_id}`);

                    // Delete local file after successful upload
                    try {
                        await fs.unlink(file.path);
                        console.log(`🗑️ Deleted local file: ${file.filename}`);
                    } catch (delErr) {
                        console.warn('Warning: Could not delete local file:', delErr);
                    }

                    // Return Cloudinary format
                    return {
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        alt: product.name  // Use product name as alt text
                    };

                } catch (uploadError) {
                    console.error('❌ Cloudinary upload failed:', uploadError);
                    // Delete local file even if upload fails
                    try {
                        await fs.unlink(file.path);
                    } catch (err) {
                        console.error('Error deleting file:', err);
                    }
                    throw uploadError;
                }
            });

            // Wait for all uploads to complete
            images = await Promise.all(uploadPromises);
            console.log(`✅ All ${images.length} images uploaded successfully`);

        } catch (uploadError) {
            console.error('❌ Error uploading images:', uploadError.message);
            return res.status(500).json({
                success: false,
                message: "Failed to upload images to cloud storage",
                error: uploadError.message
            });
        }

        // ✅ CRITICAL: Assign images to product
        product.images = images;
        console.log(`📝 Assigned ${images.length} images to product`);
        
        // ✅ Save product with images
        await product.save();
        console.log(`✅ Product saved with images: ${product._id}`);

        // ✅ Populate references for response
        await product.populate({
            path: 'category',
            select: 'name'
        });
        await product.populate({
            path: 'seller',
            select: 'fullName avatar'
        });

        return res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            product
        });

    } catch (error) {
        console.error('❌ Error in uploadProductImages:', error);
        
        // Clean up remaining local files
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
            }
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload images"
        });
    }
};


// ============================================
// DELETE PRODUCT IMAGE
// ============================================
export const deleteProductImage = async (req, res, next) => {
    try {
        const { productId, imageId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const image = product.images.find(img => img._id.toString() === imageId);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: "Image not found"
            });
        }

        await cloudinary.v2.uploader.destroy(image.public_id);

        product.images = product.images.filter(img => img._id.toString() !== imageId);
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PRODUCT PRICE
// ============================================
export const updateProductPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { costPrice, regularPrice, sellingPrice, discountPercentage } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (costPrice) product.pricing.costPrice = costPrice;
        if (regularPrice) product.pricing.regularPrice = regularPrice;
        if (sellingPrice) product.pricing.sellingPrice = sellingPrice;
        if (discountPercentage !== undefined) product.pricing.discountPercentage = discountPercentage;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Price updated successfully",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PRODUCT STOCK
// ============================================
export const updateProductStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { available, reserved } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (available !== undefined) product.stock.available = available;
        if (reserved !== undefined) product.stock.reserved = reserved;

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD PRODUCT REVIEW
// ============================================
export const addProductReview = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Implement review logic

        return res.status(201).json({
            success: true,
            message: "Review added successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRODUCT REVIEWS
// ============================================
export const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Implement get reviews logic

        return res.status(200).json({
            success: true,
            reviews: []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// RATE PRODUCT
// ============================================
export const rateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Implement rating logic

        return res.status(200).json({
            success: true,
            message: "Rating added successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
