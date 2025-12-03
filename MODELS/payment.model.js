// backend/MODELS/Payment.model.js

import { Schema, model } from "mongoose";

const paymentSchema = new Schema({
    // Order reference
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: [true, "Order is required"]
    },

    // Customer reference
    customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer is required"]
    },

    // Payment details
    amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0, "Amount cannot be negative"]
    },

    // Payment method
    method: {
        type: String,
        enum: ["credit_card", "debit_card", "upi", "net_banking", "wallet", "cod"],
        required: [true, "Payment method is required"]
    },

    // Payment status
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
        default: "pending"
    },

    // Transaction ID
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },

    // Gateway reference
    gateway: {
        name: String,
        referenceId: String,
        responseCode: String,
        responseMessage: String
    },

    // Card details (for card payments - masked)
    card: {
        last4: String,
        brand: String,
        expiryMonth: Number,
        expiryYear: Number
    },

    // UPI details
    upi: {
        vpa: String,
        provider: String
    },

    // Net banking details
    netBanking: {
        bank: String,
        accountType: String
    },

    // Wallet details
    wallet: {
        provider: String,
        walletId: String
    },

    // COD details
    cod: {
        amount: Number,
        collectedAt: Date,
        collectedBy: String
    },

    // Refund information
    refund: {
        isRefunded: {
            type: Boolean,
            default: false
        },
        refundAmount: Number,
        refundTransactionId: String,
        refundReason: String,
        refundedAt: Date,
        refundStatus: {
            type: String,
            enum: ["pending", "processed", "failed"],
            default: "pending"
        }
    },

    // Payment timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },

    completedAt: Date,
    failedAt: Date,
    failureReason: String,

    // Retry information
    retries: {
        type: Number,
        default: 0,
        max: [3, "Maximum 3 retries allowed"]
    },

    lastRetryAt: Date,

    // Invoice
    invoice: {
        number: String,
        url: String,
        generatedAt: Date
    },

    // Notes
    notes: String

}, { timestamps: true });

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ completedAt: -1 });

const Payment = model("Payment", paymentSchema);
export default Payment;
