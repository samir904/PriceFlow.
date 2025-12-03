// backend/MODELS/PricingStrategy.js

import { Schema, model } from "mongoose";

const pricingStrategySchema = new Schema({
    // Strategy name
    name: {
        type: String,
        required: [true, "Strategy name is required"],
        unique: true,
        trim: true
    },

    // Description
    description: {
        type: String,
        default: ""
    },

    // Product reference
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"]
    },

    // Strategy type
    strategyType: {
        type: String,
        enum: ["fixed", "percentage", "tiered", "dynamic", "seasonal", "psychological"],
        required: [true, "Strategy type is required"]
    },

    // Base pricing
    basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: [0, "Base price cannot be negative"]
    },

    // Fixed price strategy
    fixed: {
        price: Number
    },

    // Percentage discount strategy
    percentage: {
        discountPercent: {
            type: Number,
            min: [0, "Discount cannot be negative"],
            max: [100, "Discount cannot exceed 100"]
        },
        finalPrice: Number
    },

    // Tiered pricing strategy
    tiered: [{
        minQuantity: {
            type: Number,
            required: true
        },
        maxQuantity: Number,
        price: {
            type: Number,
            required: true
        },
        discount: Number
    }],

    // Dynamic pricing strategy
    dynamic: {
        priceAdjustmentFactor: {
            type: Number,
            default: 1.0,
            min: [0.1, "Factor cannot be less than 0.1"]
        },
        basedOn: {
            type: String,
            enum: ["demand", "inventory", "competition", "time"],
            default: "demand"
        },
        updateFrequency: {
            type: String,
            enum: ["hourly", "daily", "weekly"],
            default: "daily"
        }
    },

    // Seasonal pricing strategy
    seasonal: [{
        season: {
            type: String,
            enum: ["spring", "summer", "autumn", "winter", "festival", "custom"],
            required: true
        },
        startDate: Date,
        endDate: Date,
        priceMultiplier: {
            type: Number,
            required: true,
            min: [0.1, "Multiplier cannot be less than 0.1"]
        }
    }],

    // Psychological pricing strategy
    psychological: {
        charmsPrice: {
            type: Boolean,
            default: true
        },
        bundleDiscount: Number,
        limitedTimeOffer: {
            isActive: Boolean,
            validUntil: Date,
            discountPercent: Number
        }
    },

    // Validity period
    validFrom: {
        type: Date,
        required: true
    },

    validUntil: Date,

    // Active status
    isActive: {
        type: Boolean,
        default: true
    },

    // Priority (for multiple strategies)
    priority: {
        type: Number,
        default: 0
    },

    // Performance metrics
    metrics: {
        appliedCount: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        totalUnitsSold: {
            type: Number,
            default: 0
        },
        averageDiscount: Number
    },

    // Created by (admin/seller)
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

// Indexes
pricingStrategySchema.index({ product: 1 });
pricingStrategySchema.index({ isActive: 1 });
pricingStrategySchema.index({ strategyType: 1 });
pricingStrategySchema.index({ validFrom: 1, validUntil: 1 });

const PricingStrategy = model("PricingStrategy", pricingStrategySchema);
export default PricingStrategy;
