// backend/MODELS/Category.model.js

import { Schema, model } from "mongoose";

const categorySchema = new Schema({
    // Category name
    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true,
        trim: true,
        minlength: [3, "Category name must be at least 3 characters"],
        maxlength: [50, "Category name must not exceed 50 characters"],
        lowercase: true
    },

    // Category slug for URL
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Description
    description: {
        type: String,
        default: "",
        maxlength: [500, "Description must not exceed 500 characters"]
    },

    // Category image
    image: {
        public_id: String,
        secure_url: String
    },

    // Parent category (for subcategories)
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },

    // Is active
    isActive: {
        type: Boolean,
        default: true
    },

    // Commission percentage
    commissionPercentage: {
        type: Number,
        default: 10,
        min: [0, "Commission cannot be negative"],
        max: [100, "Commission cannot exceed 100"]
    },

    // Total products in category
    totalProducts: {
        type: Number,
        default: 0
    },

    // Sorting order
    sortOrder: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentCategory: 1 });

// Generate slug from name
categorySchema.pre("save", function(next) {
    if (!this.slug) {
        this.slug = this.name.replace(/\s+/g, "-");
    }
});

const Category = model("Category", categorySchema);
export default Category;
