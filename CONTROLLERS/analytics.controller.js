// backend/CONTROLLERS/analytics.controller.js

import Analytics from "../models/analytics.model.js";
import Order from "../CONFIG/order.model.js";
import Product from "../models/Product.model.js";

import User from "../CONFIG/user.js";


// ============================================
// GET SALES ANALYTICS (Seller)
// ============================================
export const getSalesAnalytics = async (req, res, next) => {
    try {
        const { period = "month" } = req.query;

        let startDate = new Date();
        if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
        else if (period === "year") startDate.setFullYear(startDate.getFullYear() - 1);
        else if (period === "week") startDate.setDate(startDate.getDate() - 7);

        const orders = await Order.find({
            createdAt: { $gte: startDate }
        });

        const totalSales = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
        const averageOrderValue = totalRevenue / (totalSales || 1);

        const analytics = {
            period,
            totalSales,
            totalRevenue,
            averageOrderValue,
            trend: "up" // Calculate based on previous period
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET REVENUE ANALYTICS (Seller)
// ============================================
export const getRevenueAnalytics = async (req, res, next) => {
    try {
        const orders = await Order.find({ createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } });

        const daily = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            daily[date] = (daily[date] || 0) + order.pricing.total;
        });

        return res.status(200).json({
            success: true,
            revenue: daily
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CUSTOMER ANALYTICS (Seller)
// ============================================
export const getCustomerAnalytics = async (req, res, next) => {
    try {
        const totalCustomers = await User.countDocuments({ role: "USER" });
        const newCustomers = await User.countDocuments({
            role: "USER",
            createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
        });
        const returningCustomers = totalCustomers - newCustomers;

        const analytics = {
            totalCustomers,
            newCustomers,
            returningCustomers,
            retentionRate: ((returningCustomers / totalCustomers) * 100).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TOP PRODUCTS (Seller)
// ============================================
export const getTopProducts = async (req, res, next) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: {
                _id: "$items.product",
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }}
        ]);

        return res.status(200).json({
            success: true,
            topProducts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET INVENTORY ANALYTICS (Seller)
// ============================================
export const getInventoryAnalytics = async (req, res, next) => {
    try {
        const products = await Product.find({ seller: req.user.id });

        const analytics = {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.isActive).length,
            featuredProducts: products.filter(p => p.isFeatured).length,
            averagePrice: (products.reduce((sum, p) => sum + p.pricing.sellingPrice, 0) / products.length).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TRAFFIC ANALYTICS (Seller)
// ============================================
export const getTrafficAnalytics = async (req, res, next) => {
    try {
        const products = await Product.find({ seller: req.user.id });

        const totalViews = products.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
        const totalClicks = products.reduce((sum, p) => sum + (p.metrics?.clicks || 0), 0);

        const analytics = {
            totalViews,
            totalClicks,
            conversionRate: ((totalClicks / (totalViews || 1)) * 100).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT ANALYTICS (Seller)
// ============================================
export const getPaymentAnalytics = async (req, res, next) => {
    try {
        const orders = await Order.find({ createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } });

        const analytics = {
            totalTransactions: orders.length,
            successfulTransactions: orders.filter(o => o.payment.status === "completed").length,
            pendingTransactions: orders.filter(o => o.payment.status === "pending").length,
            failedTransactions: orders.filter(o => o.payment.status === "failed").length
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICING ANALYTICS (Seller)
// ============================================
export const getPricingAnalytics = async (req, res, next) => {
    try {
        const products = await Product.find({ seller: req.user.id });

        const pricingData = {
            averageCost: (products.reduce((sum, p) => sum + p.pricing.costPrice, 0) / products.length).toFixed(2),
            averageRegularPrice: (products.reduce((sum, p) => sum + p.pricing.regularPrice, 0) / products.length).toFixed(2),
            averageSellingPrice: (products.reduce((sum, p) => sum + p.pricing.sellingPrice, 0) / products.length).toFixed(2),
            averageMargin: ((products.reduce((sum, p) => sum + ((p.pricing.sellingPrice - p.pricing.costPrice) / p.pricing.sellingPrice * 100), 0)) / products.length).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            pricingData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET COMPETITOR ANALYSIS
// ============================================
export const getCompetitorAnalysis = async (req, res, next) => {
    try {
        // TODO: Implement competitor analysis logic
        
        const analysis = {
            message: "Competitor analysis coming soon",
            features: ["Price comparison", "Feature comparison", "Rating comparison"]
        };

        return res.status(200).json({
            success: true,
            analysis
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TREND ANALYSIS
// ============================================
export const getTrendAnalysis = async (req, res, next) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(10);

        const trends = {
            hotProducts: products.filter(p => p.isTrending),
            risingProducts: products.slice(0, 5),
            fallingProducts: products.slice(-5)
        };

        return res.status(200).json({
            success: true,
            trends
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SUMMARY ANALYTICS (Seller)
// ============================================
export const getSummaryAnalytics = async (req, res, next) => {
    try {
        const orders = await Order.find({ createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } });
        const products = await Product.find({ seller: req.user.id });

        const summary = {
            totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0),
            totalOrders: orders.length,
            totalProducts: products.length,
            averageOrderValue: (orders.reduce((sum, o) => sum + o.pricing.total, 0) / (orders.length || 1)).toFixed(2),
            conversionRate: "0%"
        };

        return res.status(200).json({
            success: true,
            summary
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ANALYTICS BY PRODUCT
// ============================================
export const getAnalyticsByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const analytics = {
            productId,
            views: product.metrics?.views || 0,
            clicks: product.metrics?.clicks || 0,
            conversions: product.metrics?.conversions || 0,
            revenue: product.metrics?.revenue || 0
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE ANALYTICS REPORT
// ============================================
export const generateAnalyticsReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const report = {
            period: `${startDate} to ${endDate}`,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0),
            averageOrderValue: (orders.reduce((sum, o) => sum + o.pricing.total, 0) / (orders.length || 1)).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            report
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// EXPORT ANALYTICS
// ============================================
export const exportAnalytics = async (req, res, next) => {
    try {
        const { format } = req.params;

        // TODO: Export to CSV, PDF, Excel, etc.

        return res.status(200).json({
            success: true,
            message: `Export to ${format} initiated`
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL ANALYTICS (Admin)
// ============================================
export const getAnalytics = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const analytics = await Analytics.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Analytics.countDocuments();

        return res.status(200).json({
            success: true,
            analytics,
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
// CREATE ANALYTICS
// ============================================
export const createAnalytics = async (req, res, next) => {
    try {
        const { data } = req.body;

        const analytics = await Analytics.create(data);

        return res.status(201).json({
            success: true,
            message: "Analytics created",
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ANALYTICS BY DATE
// ============================================
export const getAnalyticsByDate = async (req, res, next) => {
    try {
        const { date } = req.params;

        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const analytics = await Analytics.find({
            createdAt: { $gte: startDate, $lt: endDate }
        });

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ANALYTICS BY CATEGORY
// ============================================
export const getAnalyticsByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const products = await Product.find({ category: categoryId });

        const totalViews = products.reduce((sum, p) => sum + (p.metrics?.views || 0), 0);
        const totalSales = products.reduce((sum, p) => sum + (p.metrics?.sales || 0), 0);

        return res.status(200).json({
            success: true,
            analytics: {
                categoryId,
                totalViews,
                totalSales,
                products: products.length
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TOP CATEGORIES
// ============================================
export const getTopCategories = async (req, res, next) => {
    try {
        const topCategories = await Product.aggregate([
            { $group: {
                _id: "$category",
                count: { $sum: 1 },
                totalViews: { $sum: "$metrics.views" }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return res.status(200).json({
            success: true,
            topCategories
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CUSTOMER SEGMENTATION
// ============================================
export const getCustomerSegmentation = async (req, res, next) => {
    try {
        const segments = {
            new: await User.countDocuments({
                role: "USER",
                createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
            }),
            active: await User.countDocuments({
                role: "USER",
                lastLogin: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
            }),
            dormant: await User.countDocuments({
                role: "USER",
                lastLogin: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
            })
        };

        return res.status(200).json({
            success: true,
            segments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DATE RANGE ANALYTICS (Admin)
// ============================================
export const getDateRangeAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }

        // Parse dates properly
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 10);

        // Get orders in date range
        const orders = await Order.find({
            createdAt: {
                $gte: start,
                $lte: end
            }
        })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .sort({ createdAt: -1 });

        const total = await Order.countDocuments({
            createdAt: {
                $gte: start,
                $lte: end
            }
        });

        // Calculate analytics
        const totalRevenue = orders.reduce((sum, o) => sum + o.pricing.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = (totalRevenue / (totalOrders || 1)).toFixed(2);

        const analytics = {
            period: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            },
            totalOrders,
            totalRevenue,
            averageOrderValue,
            orders,
            pagination: {
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                total
            }
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error('❌ Error in getDateRangeAnalytics:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// ============================================
// GET PROFIT ANALYTICS (Seller)
// ============================================
export const getProfitAnalytics = async (req, res, next) => {
    try {
        const { period = "month" } = req.query;

        let startDate = new Date();
        if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
        else if (period === "year") startDate.setFullYear(startDate.getFullYear() - 1);
        else if (period === "week") startDate.setDate(startDate.getDate() - 7);

        // Get seller's products and orders
        const products = await Product.find({ seller: req.user.id });
        const productIds = products.map(p => p._id);

        // Get orders containing these products
        const orders = await Order.find({
            "items.product": { $in: productIds },
            createdAt: { $gte: startDate }
        });

        // Calculate profit
        let totalRevenue = 0;
        let totalCost = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p._id.toString() === item.product.toString());
                if (product) {
                    totalRevenue += item.total;
                    totalCost += (product.pricing.costPrice * item.quantity);
                }
            });
        });

        const totalProfit = totalRevenue - totalCost;
        const profitMargin = ((totalProfit / (totalRevenue || 1)) * 100).toFixed(2);

        const analytics = {
            period,
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin: `${profitMargin}%`,
            totalOrders: orders.length
        };

        return res.status(200).json({
            success: true,
            analytics
        });

    } catch (error) {
        console.error('❌ Error in getProfitAnalytics:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
