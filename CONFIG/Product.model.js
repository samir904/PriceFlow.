
// backend/MODELS/Product.model.js

import { Schema, model } from "mongoose";

const productSchema = new Schema({
    // Product name
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        minlength: [3, "Product name must be at least 3 characters"],
        maxlength: [100, "Product name must not exceed 100 characters"]
    },

    // Product slug
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },

    // SKU (Stock Keeping Unit)
    sku: {
        type: String,
        unique: true,
        required: [true, "SKU is required"],
        uppercase: true
    },

    // Product description
    description: {
        type: String,
        required: [true, "Product description is required"],
        minlength: [10, "Description must be at least 10 characters"],
        maxlength: [2000, "Description must not exceed 2000 characters"]
    },

    // Category reference
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"]
    },

    // Subcategory
    subcategory: {
        type: String,
        default: ""
    },

    // Pricing
    pricing: {
        // Cost price
        costPrice: {
            type: Number,
            required: [true, "Cost price is required"],
            min: [0, "Cost price cannot be negative"]
        },

        // Regular/MRP price
        regularPrice: {
            type: Number,
            required: [true, "Regular price is required"],
            min: [0, "Regular price cannot be negative"]
        },

        // Selling price
        sellingPrice: {
            type: Number,
            required: [true, "Selling price is required"],
            min: [0, "Selling price cannot be negative"]
        },

        // Discount percentage
        discountPercentage: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100"]
        },

        // Margin percentage (calculated)
        marginPercentage: Number
    },

    // Product images
    images: [{
        public_id: String,
        secure_url: String,
        alt: String
    }],

    // Stock information
    stock: {
        // Available quantity
        available: {
            type: Number,
            required: [true, "Stock quantity is required"],
            min: [0, "Stock cannot be negative"],
            default: 0
        },

        // Reserved quantity
        reserved: {
            type: Number,
            default: 0,
            min: [0, "Reserved stock cannot be negative"]
        },

        // Reorder level
        reorderLevel: {
            type: Number,
            default: 10,
            min: [0, "Reorder level cannot be negative"]
        },

        // Last restocked date
        lastRestocked: Date
    },

    // Ratings & Reviews
    ratings: {
        // Average rating
        average: {
            type: Number,
            default: 0,
            min: [0, "Rating cannot be below 0"],
            max: [5, "Rating cannot exceed 5"]
        },

        // Total reviews
        totalReviews: {
            type: Number,
            default: 0
        },

        // Rating distribution
        distribution: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        }
    },

    // Seller information
    seller: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Seller is required"]
    },

    // Tags for search
    tags: [String],

    // Product specifications
    specifications: [{
        key: String,
        value: String
    }],

    // Warranty & Return
    warranty: {
        period: {
            type: Number,
            default: 0
        },
        unit: {
            type: String,
            enum: ["days", "months", "years"],
            default: "days"
        },
        description: String
    },

    // Return policy
    returnPolicy: {
        returnable: {
            type: Boolean,
            default: true
        },
        returnDays: {
            type: Number,
            default: 30
        }
    },

    // Product status
    isActive: {
        type: Boolean,
        default: true
    },

    // Featured product
    isFeatured: {
        type: Boolean,
        default: false
    },

    // Trending status
    isTrending: {
        type: Boolean,
        default: false
    },

    // SEO
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },

    // Sales metrics
    metrics: {
        totalSold: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        wishlistCount: {
            type: Number,
            default: 0
        }
    }

}, { timestamps: true });

// Indexes
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ "pricing.sellingPrice": 1 });
productSchema.index({ "ratings.average": -1 });
productSchema.index({ isFeatured: 1, isTrending: 1 });
productSchema.index({ createdAt: -1 });

// Generate slug from name
productSchema.pre("save", function(next) {
    if (!this.slug) {
        this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
    }
});

// Calculate margin percentage
productSchema.pre("save", function(next) {
    if (this.pricing) {
        const margin = this.pricing.sellingPrice - this.pricing.costPrice;
        this.pricing.marginPercentage = ((margin / this.pricing.costPrice) * 100).toFixed(2);
    }
});

const Product = model("Product", productSchema);
export default Product;

