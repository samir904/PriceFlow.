// backend/MODELS/Analytics.model.js

import { Schema, model } from "mongoose";

const analyticsSchema = new Schema({
    // Date of analytics record
    date: {
        type: Date,
        required: true,
        index: true,
        //default:Date.now// is this posible to add default date as date.now please help me in this ok 
    },

    // Product analytics
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product"
    },

    // Category analytics
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },

    // Sales metrics
    sales: {
        // Total orders
        totalOrders: {
            type: Number,
            default: 0
        },

        // Total units sold
        unitsSold: {
            type: Number,
            default: 0
        },

        // Total revenue
        revenue: {
            type: Number,
            default: 0
        },

        // Average order value
        averageOrderValue: Number,

        // Repeat customer orders
        repeatCustomerOrders: {
            type: Number,
            default: 0
        },

        // New customer orders
        newCustomerOrders: {
            type: Number,
            default: 0
        }
    },

    // Pricing analytics
    pricing: {
        // Average selling price
        averageSellingPrice: Number,

        // Discount given
        totalDiscount: {
            type: Number,
            default: 0
        },

        // Tax collected
        totalTax: {
            type: Number,
            default: 0
        },

        // Profit
        totalProfit: {
            type: Number,
            default: 0
        },

        // Profit margin %
        profitMargin: Number
    },

    // Customer metrics
    customers: {
        // Total customers
        uniqueCustomers: {
            type: Number,
            default: 0
        },

        // New customers
        newCustomers: {
            type: Number,
            default: 0
        },

        // Returning customers
        returningCustomers: {
            type: Number,
            default: 0
        },

        // Customer satisfaction (average rating)
        averageRating: Number,

        // Total reviews
        totalReviews: {
            type: Number,
            default: 0
        }
    },

    // Inventory metrics
    inventory: {
        // Stock on hand
        stockOnHand: {
            type: Number,
            default: 0
        },

        // Stock out incidents
        outOfStockDays: {
            type: Number,
            default: 0
        },

        // Stock turnover
        stockTurnover: Number,

        // Inventory write-offs
        writeOffs: {
            type: Number,
            default: 0
        }
    },

    // Website/Traffic metrics
    traffic: {
        // Product page views
        pageViews: {
            type: Number,
            default: 0
        },

        // Product clicks
        clicks: {
            type: Number,
            default: 0
        },

        // Add to cart
        addToCart: {
            type: Number,
            default: 0
        },

        // Conversion rate %
        conversionRate: Number,

        // Wishlist adds
        wishlistAdds: {
            type: Number,
            default: 0
        }
    },

    // Payment metrics
    payments: {
        // Total payments
        totalPayments: {
            type: Number,
            default: 0
        },

        // Successful payments
        successfulPayments: {
            type: Number,
            default: 0
        },

        // Failed payments
        failedPayments: {
            type: Number,
            default: 0
        },

        // Payment success rate %
        successRate: Number,

        // Average payment value
        averagePaymentValue: Number,

        // Refunds
        totalRefunds: {
            type: Number,
            default: 0
        }
    },

    // Competitor analysis
    competitorAnalysis: {
        // Our average price
        ourPrice: Number,

        // Competitor average price
        competitorAvgPrice: Number,

        // Price variance %
        priceVariance: Number,

        // Market position
        marketPosition: String  // "cheaper", "competitive", "premium"
    },

    // Summary metrics
    summary: {
        // Total transactions
        totalTransactions: {
            type: Number,
            default: 0
        },

        // Daily average
        dailyAverage: Number,

        // Best performing hour
        bestHour: Number,

        // Trend
        trend: {
            type: String,
            enum: ["up", "down", "stable"],
            default: "stable"
        },

        // Trend percentage
        trendPercentage: Number
    }

}, { timestamps: true });

// Indexes for performance
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ product: 1, date: -1 });
analyticsSchema.index({ category: 1, date: -1 });
analyticsSchema.index({ "sales.revenue": -1 });

const Analytics = model("Analytics", analyticsSchema);
export default Analytics;
