// backend/CONTROLLERS/report.controller.js

import Report from "../MODELS/Report.model.js";
import Order from "../CONFIG/order.model.js";
import Product from "../CONFIG/Product.model.js";
import User from "../CONFIG/user.js";
import Payment from "../MODELS/Payment.model.js";

// ============================================
// CREATE SALES REPORT
// ============================================
export const createSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, type } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required"
            });
        }

        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const report = await Report.create({
            type: type || "sales",
            seller: req.user.id,
            startDate,
            endDate,
            data: {
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0),
                averageOrderValue: (orders.reduce((sum, o) => sum + o.pricing.total, 0) / (orders.length || 1))
            }
        });

        return res.status(201).json({
            success: true,
            message: "Sales report created",
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
// GET REPORTS
// ============================================
export const getReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = req.user.role === "SELLER" ? { seller: req.user.id } : {};

        const reports = await Report.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments(query);

        return res.status(200).json({
            success: true,
            reports,
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
// GET REPORT BY ID
// ============================================
export const getReportById = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findById(reportId)
            .populate("seller", "fullName businessProfile.businessName");

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

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
// UPDATE REPORT
// ============================================
export const updateReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report updated",
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
// DELETE REPORT
// ============================================
export const deleteReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        await Report.findByIdAndDelete(reportId);

        return res.status(200).json({
            success: true,
            message: "Report deleted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE REPORT
// ============================================
export const generateReport = async (req, res, next) => {
    try {
        const { type, startDate, endDate } = req.body;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Report type is required"
            });
        }

        let reportData = {};

        if (type === "sales") {
            const orders = await Order.find({
                createdAt: {
                    $gte: new Date(startDate || Date.now() - 30*24*60*60*1000),
                    $lte: new Date(endDate || Date.now())
                }
            });

            reportData = {
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0),
                averageOrderValue: (orders.reduce((sum, o) => sum + o.pricing.total, 0) / (orders.length || 1)).toFixed(2)
            };
        } else if (type === "revenue") {
            const payments = await Payment.find({ status: "completed" });
            reportData = {
                totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
                totalTransactions: payments.length
            };
        } else if (type === "customer") {
            const customers = await User.find({ role: "USER" });
            reportData = {
                totalCustomers: customers.length,
                newCustomers: customers.filter(c => c.createdAt > new Date(Date.now() - 30*24*60*60*1000)).length
            };
        } else if (type === "product") {
            const products = await Product.find();
            reportData = {
                totalProducts: products.length,
                activeProducts: products.filter(p => p.isActive).length
            };
        }

        const report = await Report.create({
            type,
            seller: req.user.role === "SELLER" ? req.user.id : null,
            startDate,
            endDate,
            data: reportData,
            status: "completed"
        });

        return res.status(201).json({
            success: true,
            message: "Report generated",
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
// GET SALES REPORT
// ============================================
export const getSalesReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "sales",
            seller: req.user.id 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET REVENUE REPORT
// ============================================
export const getRevenueReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "revenue",
            seller: req.user.id 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CUSTOMER REPORT
// ============================================
export const getCustomerReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "customer" 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRODUCT REPORT
// ============================================
export const getProductReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "product" 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET INVENTORY REPORT
// ============================================
export const getInventoryReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "inventory",
            seller: req.user.id 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICING REPORT
// ============================================
export const getPricingReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "pricing",
            seller: req.user.id 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PAYMENT REPORT
// ============================================
export const getPaymentReport = async (req, res, next) => {
    try {
        const reports = await Report.find({ 
            type: "payment" 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET COMPREHENSIVE REPORT
// ============================================
export const getComprehensiveReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        const orders = await Order.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        const comprehensiveReport = {
            period: `${startDate} to ${endDate}`,
            sales: {
                totalOrders: orders.length,
                totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0)
            },
            summary: {
                message: "Comprehensive report generated",
                includes: ["Sales", "Revenue", "Customers", "Products", "Payments"]
            }
        };

        return res.status(200).json({
            success: true,
            report: comprehensiveReport
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ARCHIVE REPORT
// ============================================
export const archiveReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status: "archived" },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report archived",
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
// DOWNLOAD REPORT
// ============================================
export const downloadReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        // TODO: Generate PDF and send download

        return res.status(200).json({
            success: true,
            message: "Report download initiated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// EXPORT REPORT
// ============================================
export const exportReport = async (req, res, next) => {
    try {
        const { reportId, format } = req.params;

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        // TODO: Export to CSV, PDF, Excel based on format

        return res.status(200).json({
            success: true,
            message: `Report exported to ${format}`
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET REPORTS BY PERIOD
// ============================================
export const getReportsByPeriod = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.body;

        const reports = await Report.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET REPORTS BY TYPE
// ============================================
export const getReportsByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reports = await Report.find({ type })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments({ type });

        return res.status(200).json({
            success: true,
            reports,
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
// GET REPORT STATS
// ============================================
export const getReportStats = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found"
            });
        }

        return res.status(200).json({
            success: true,
            stats: {
                type: report.type,
                status: report.status,
                createdAt: report.createdAt
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
// SCHEDULE REPORT
// ============================================
export const scheduleReport = async (req, res, next) => {
    try {
        const { type, frequency, emailTo } = req.body;

        if (!type || !frequency) {
            return res.status(400).json({
                success: false,
                message: "Type and frequency are required"
            });
        }

        const report = await Report.create({
            type,
            seller: req.user.id,
            scheduled: true,
            frequency,
            emailTo
        });

        return res.status(201).json({
            success: true,
            message: "Report scheduled successfully",
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
// GET SCHEDULED REPORTS
// ============================================
export const getScheduledReports = async (req, res, next) => {
    try {
        const reports = await Report.find({
            seller: req.user.id,
            scheduled: true
        });

        return res.status(200).json({
            success: true,
            reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE CUSTOM REPORT
// ============================================
export const generateCustomReport = async (req, res, next) => {
    try {
        const { name, metrics, filters, format } = req.body;

        if (!name || !metrics) {
            return res.status(400).json({
                success: false,
                message: "Name and metrics are required"
            });
        }

        const report = await Report.create({
            name,
            type: "custom",
            seller: req.user.id,
            data: { metrics, filters },
            format: format || "pdf"
        });

        return res.status(201).json({
            success: true,
            message: "Custom report generated",
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
// GET ALL REPORTS (Admin)
// ============================================
export const getAllReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const reports = await Report.find()
            .populate("seller", "fullName email")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments();

        return res.status(200).json({
            success: true,
            reports,
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
