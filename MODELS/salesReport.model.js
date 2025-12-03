// backend/MODELS/SalesReport.model.js

import { Schema, model } from "mongoose";

const salesReportSchema = new Schema({
    // Report period
    period: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
        required: true
    },

    // Period dates
    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    // Report type
    reportType: {
        type: String,
        enum: ["sales", "revenue", "customer", "product", "inventory", "pricing", "payment", "comprehensive"],
        required: true
    },

    // Sales overview
    salesOverview: {
        // Total orders
        totalOrders: {
            type: Number,
            default: 0
        },

        // Total units sold
        totalUnitsSold: {
            type: Number,
            default: 0
        },

        // Total revenue
        totalRevenue: {
            type: Number,
            default: 0
        },

        // Gross profit
        grossProfit: {
            type: Number,
            default: 0
        },

        // Net profit
        netProfit: {
            type: Number,
            default: 0
        },

        // Operating expenses
        operatingExpenses: {
            type: Number,
            default: 0
        },

        // Profit margin %
        profitMargin: Number,

        // ROI %
        roi: Number
    },

    // Top products
    topProducts: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product"
            },
            name: String,
            unitsSold: Number,
            revenue: Number,
            profitMargin: Number
        }
    ],

    // Top categories
    topCategories: [
        {
            category: {
                type: Schema.Types.ObjectId,
                ref: "Category"
            },
            name: String,
            totalSales: Number,
            revenue: Number,
            percentage: Number
        }
    ],

    // Customer analytics
    customerAnalytics: {
        // Total unique customers
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

        // Customer acquisition cost
        customerAcquisitionCost: Number,

        // Customer lifetime value
        customerLifetimeValue: Number,

        // Churn rate %
        churnRate: Number,

        // Retention rate %
        retentionRate: Number
    },

    // Inventory status
    inventoryStatus: {
        // Total inventory value
        totalInventoryValue: {
            type: Number,
            default: 0
        },

        // Items in stock
        itemsInStock: {
            type: Number,
            default: 0
        },

        // Low stock items
        lowStockItems: {
            type: Number,
            default: 0
        },

        // Out of stock items
        outOfStockItems: {
            type: Number,
            default: 0
        },

        // Inventory turnover
        inventoryTurnover: Number,

        // Days inventory outstanding
        daysInventoryOutstanding: Number
    },

    // Payment metrics
    paymentMetrics: {
        // Total transactions
        totalTransactions: {
            type: Number,
            default: 0
        },

        // Successful transactions
        successfulTransactions: {
            type: Number,
            default: 0
        },

        // Failed transactions
        failedTransactions: {
            type: Number,
            default: 0
        },

        // Transaction success rate %
        successRate: Number,

        // Total refunds
        totalRefunds: {
            type: Number,
            default: 0
        },

        // Refund rate %
        refundRate: Number,

        // Average transaction value
        averageTransactionValue: Number
    },

    // Pricing analysis
    pricingAnalysis: {
        // Average selling price
        averageSellingPrice: Number,

        // Price elasticity
        priceElasticity: Number,

        // Optimal price range
        optimalPriceMin: Number,
        optimalPriceMax: Number,

        // Price competitiveness
        competitiveness: {
            type: String,
            enum: ["expensive", "competitive", "cheap"],
            default: "competitive"
        }
    },

    // Market trends
    marketTrends: {
        // Trending products
        trendingProducts: [Schema.Types.ObjectId],

        // Declining products
        decliningProducts: [Schema.Types.ObjectId],

        // Seasonal patterns
        seasonalPatterns: String,

        // Market growth rate %
        marketGrowthRate: Number
    },

    // Recommendations
    recommendations: [
        {
            type: String,
            priority: {
                type: String,
                enum: ["high", "medium", "low"],
                default: "medium"
            },
            action: String
        }
    ],

    // Generated by
    generatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Report status
    status: {
        type: String,
        enum: ["draft", "final", "archived"],
        default: "draft"
    },

    // Notes
    notes: String

}, { timestamps: true });

// Indexes
salesReportSchema.index({ period: 1, startDate: 1 });
salesReportSchema.index({ reportType: 1 });
salesReportSchema.index({ generatedBy: 1 });
salesReportSchema.index({ status: 1 });
salesReportSchema.index({ createdAt: -1 });

const SalesReport = model("SalesReport", salesReportSchema);
export default SalesReport;
