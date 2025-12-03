// backend/CONTROLLERS/order.controller.js

import Order from "../MODELS/order.model.js";
import Product from "../MODELS/Product.model.js";
import Discount from "../MODELS/discount.model.js";
import Payment from "../MODELS/payment.model.js";

// ============================================
// CREATE ORDER
// ============================================
export const createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, billingAddress, discountCode, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        // Calculate totals
        let subtotal = 0;
        let finalItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product} not found`
                });
            }

            if (product.stock.available < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            const itemTotal = product.pricing.sellingPrice * item.quantity;
            subtotal += itemTotal;

            finalItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.pricing.sellingPrice,
                total: itemTotal
            });
        }

        let discount = 0;
        let discountDocId = null;

        // Apply discount if provided
        if (discountCode) {
            const discountDoc = await Discount.findOne({ code: discountCode.toUpperCase() });

            if (discountDoc && discountDoc.isValid()) {
                if (subtotal >= (discountDoc.restrictions.minimumCartValue || 0)) {
                    if (discountDoc.type === "percentage") {
                        discount = (subtotal * discountDoc.value) / 100;
                        if (discountDoc.maxDiscount && discount > discountDoc.maxDiscount) {
                            discount = discountDoc.maxDiscount;
                        }
                    } else if (discountDoc.type === "fixed") {
                        discount = discountDoc.value;
                    }
                    discountDocId = discountDoc._id;
                }
            }
        }

        const taxPercentage = 18;
        const tax = ((subtotal - discount) * taxPercentage) / 100;
        const total = subtotal - discount + tax;

        // Create order
        const order = await Order.create({
            customer: req.user.id,
            items: finalItems,
            pricing: {
                subtotal,
                discount,
                discountCode,
                tax,
                taxPercentage,
                shipping: 0,
                total
            },
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            payment: {
                method: paymentMethod || "cod",
                status: "pending"
            }
        });

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET MY ORDERS
// ============================================
export const getMyOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find({ customer: req.user.id })
            .populate("items.product", "name sku")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments({ customer: req.user.id });

        return res.status(200).json({
            success: true,
            orders,
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
// GET ORDER BY ID
// ============================================
// ============================================
// GET ORDER BY ID - FIXED
// ============================================
export const getOrderById = async (req, res, next) => {
    console.log('Get order route hit');
    try {
        const { orderId } = req.params;

        // ✅ Get order WITHOUT populate first
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // ✅ Check authorization BEFORE populate
        if (order.customer.toString() !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error('❌ Error in getOrderById:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================
// GET ORDER BY ORDER NUMBER
// ============================================
export const getOrderByNumber = async (req, res, next) => {
    try {
        const { orderNumber } = req.params;

        const order = await Order.findOne({ orderNumber })
            .populate("customer", "fullName email")
            .populate("items.product");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TRACK ORDER
// ============================================
export const trackOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .select("orderNumber status shipping shippingAddress");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            tracking: {
                orderNumber: order.orderNumber,
                status: order.status,
                shipping: order.shipping,
                address: order.shippingAddress
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
// UPDATE ORDER STATUS
// ============================================
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated",
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CANCEL ORDER
// ============================================
export const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status === "delivered" || order.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel this order"
            });
        }

        order.status = "cancelled";
        order.cancelledAt = new Date();
        order.cancelledReason = reason;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE SHIPPING ADDRESS
// ============================================
export const updateShippingAddress = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const shippingAddress = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status !== "pending" && order.status !== "confirmed") {
            return res.status(400).json({
                success: false,
                message: "Cannot update address for this order"
            });
        }

        order.shippingAddress = shippingAddress;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Shipping address updated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REQUEST RETURN
// ============================================
export const requestReturn = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { items, reason } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status !== "delivered") {
            return res.status(400).json({
                success: false,
                message: "Can only return delivered orders"
            });
        }

        order.returns.isReturned = true;
        order.returns.returnedItems = items;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return request submitted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// APPROVE RETURN
// ============================================
export const approveReturn = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.returns.returnedItems.forEach(item => {
            item.status = "approved";
        });
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return approved"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REJECT RETURN
// ============================================
export const rejectReturn = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.returns.returnedItems.forEach(item => {
            item.status = "rejected";
        });
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return rejected"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE INVOICE
// ============================================
export const generateInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("customer", "fullName email phone address")
            .populate("items.product");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // TODO: Generate PDF invoice using a library like pdfkit

        return res.status(200).json({
            success: true,
            message: "Invoice generated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DOWNLOAD INVOICE
// ============================================
export const downloadInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // TODO: Download generated invoice

        return res.status(200).json({
            success: true,
            message: "Invoice download started"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD ORDER NOTE
// ============================================
export const addOrderNote = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({
                success: false,
                message: "Please provide a note"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        order.notes = note;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Note added"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL ORDERS (Admin)
// ============================================
export const getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find()
            .populate("customer", "fullName email")
            .populate("items.product")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments();

        return res.status(200).json({
            success: true,
            orders,
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
// GET ORDERS BY STATUS (Admin)
// ============================================
export const getOrdersByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const orders = await Order.find({ status })
            .populate("customer", "fullName email")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments({ status });

        return res.status(200).json({
            success: true,
            orders,
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
// GET ORDERS BY DATE RANGE (Admin)
// ============================================
export const getOrdersByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate, page = 1, limit = 10 } = req.body;

        const orders = await Order.find({
            orderDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
            .populate("customer", "fullName")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments({
            orderDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        return res.status(200).json({
            success: true,
            orders,
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
// GET ORDER STATS
// ============================================
export const getOrderStats = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const stats = {
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.pricing.total,
            items: order.items.length,
            createdAt: order.orderDate
        };

        return res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
