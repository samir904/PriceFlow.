// backend/MODELS/Order.model.js

import { Schema, model } from "mongoose";

const orderSchema = new Schema({
    // Order number (unique)
    orderNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    // Customer reference
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer is required"]
    },

    // Order items
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"]
        },
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    }],

    // Pricing breakdown
    pricing: {
        subtotal: {
            type: Number,
            required: true,
            min: [0, "Subtotal cannot be negative"]
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, "Discount cannot be negative"]
        },
        discountCode: String,
        tax: {
            type: Number,
            default: 0,
            min: [0, "Tax cannot be negative"]
        },
        taxPercentage: {
            type: Number,
            default: 18
        },
        shipping: {
            type: Number,
            default: 0,
            min: [0, "Shipping cannot be negative"]
        },
        total: {
            type: Number,
            required: true
        }
    },

    // Shipping address
    shippingAddress: {
        fullName: String,
        phone: String,
        email: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    // Billing address
    billingAddress: {
        fullName: String,
        phone: String,
        email: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },

    // Shipping information
    shipping: {
        carrier: String,
        trackingNumber: String,
        estimatedDelivery: Date,
        actualDelivery: Date,
        shippingStatus: {
            type: String,
            enum: ["pending", "processing", "shipped", "in-transit", "delivered", "cancelled"],
            default: "pending"
        }
    },

    // Order status
    status: {
        type: String,
        enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
        default: "pending"
    },

    // Payment information
    payment: {
        method: {
            type: String,
            enum: ["credit_card", "debit_card", "upi", "net_banking", "wallet", "cod"],
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending"
        },
        transactionId: String,
        paidAmount: Number,
        paidAt: Date
    },

    // Notes
    notes: String,

    // Return information
    returns: {
        isReturned: {
            type: Boolean,
            default: false
        },
        returnedItems: [{
            product: Schema.Types.ObjectId,
            quantity: Number,
            reason: String,
            status: {
                type: String,
                enum: ["pending", "approved", "rejected", "processed"],
                default: "pending"
            }
        }],
        refundAmount: Number
    },

    // Timestamps
    orderDate: {
        type: Date,
        default: Date.now
    },

    cancelledAt: Date,
    cancelledReason: String

}, { timestamps: true });

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ "shipping.shippingStatus": 1 });

// Generate order number
orderSchema.pre("save", async function(next) {
    if (!this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }
});

const Order = model("Order", orderSchema);
export default Order;
