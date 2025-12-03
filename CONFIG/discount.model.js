// backend/MODELS/Discount.model.js

import { Schema, model } from "mongoose";

const discountSchema = new Schema({
    // Discount code/name
    code: {
        type: String,
        required: [true, "Discount code is required"],
        unique: true,
        uppercase: true,
        trim: true
    },

    // Description
    description: {
        type: String,
        default: ""
    },

    // Discount type
    type: {
        type: String,
        enum: ["percentage", "fixed", "bogo", "free_shipping", "bundle"],
        required: [true, "Discount type is required"]
    },

    // Discount value
    value: {
        type: Number,
        required: [true, "Discount value is required"],
        min: [0, "Discount value cannot be negative"]
    },

    // Maximum discount amount (for percentage discounts)
    maxDiscount: {
        type: Number,
        default: null
    },

    // BOGO (Buy One Get One) details
    bogo: {
        buyQuantity: Number,
        getQuantity: Number,
        products: [Schema.Types.ObjectId]
    },

    // Bundle details
    bundle: {
        products: [Schema.Types.ObjectId],
        bundlePrice: Number
    },

    // Applicable products
    applicableProducts: [
        {
            type: Schema.Types.ObjectId,
            ref: "Product"
        }
    ],

    // Applicable categories
    applicableCategories: [
        {
            type: Schema.Types.ObjectId,
            ref: "Category"
        }
    ],

    // Usage restrictions
    restrictions: {
        // Minimum cart value
        minimumCartValue: {
            type: Number,
            default: 0
        },

        // Maximum uses
        maxUses: Number,

        // Uses per customer
        usesPerCustomer: {
            type: Number,
            default: 1
        },

        // Customer segments
        applicableCustomers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // Customer groups
        customerGroups: [
            {
                type: String,
                enum: ["new", "vip", "bulk_buyer", "all"]
            }
        ]
    },

    // Valid period
    validFrom: {
        type: Date,
        required: true
    },

    validUntil: {
        type: Date,
        required: true
    },

    // Active status
    isActive: {
        type: Boolean,
        default: true
    },

    // Visibility
    isPublic: {
        type: Boolean,
        default: true
    },

    // Usage tracking
    usage: {
        totalUsed: {
            type: Number,
            default: 0
        },

        usedByCustomers: [
            {
                customer: {
                    type: Schema.Types.ObjectId,
                    ref: "User"
                },
                usedCount: Number,
                lastUsedAt: Date
            }
        ],

        totalDiscountGiven: {
            type: Number,
            default: 0
        }
    },

    // Created by
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

// Indexes
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ validFrom: 1, validUntil: 1 });
discountSchema.index({ applicableProducts: 1 });
discountSchema.index({ applicableCategories: 1 });

// Check if discount is valid
discountSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           this.validFrom <= now && 
           this.validUntil >= now &&
           (!this.restrictions.maxUses || this.usage.totalUsed < this.restrictions.maxUses);
};

// Check if customer can use discount
discountSchema.methods.canCustomerUse = function(customerId) {
    const customerUsage = this.usage.usedByCustomers.find(
        u => u.customer.toString() === customerId.toString()
    );
    
    const usesPerCustomer = this.restrictions.usesPerCustomer || 1;
    const usedCount = customerUsage ? customerUsage.usedCount : 0;
    
    return usedCount < usesPerCustomer;
};

const Discount = model("Discount", discountSchema);
export default Discount;
