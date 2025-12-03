// backend/MODELS/index.js
// Export all models for easy import

export { default as User } from "./user.model.js";
export { default as Category } from "./category.model.js";
export { default as Product } from "./product.model.js";
export { default as Order } from "./order.model.js";
export { default as Payment } from "./payment.model.js";
export { default as PricingStrategy } from "./PricingStrategy.model.js";
export { default as Discount } from "./discount.model.js";
export { default as Inventory } from "./Inventory.model.js";
export { default as Analytics } from "./analytics.model.js";
export { default as SalesReport } from "./salesReport.model.js";

/*
USAGE IN CONTROLLERS:

// Single imports
import { Product, Order, Discount } from "../MODELS/index.js";

// Or destructure
import * as Models from "../MODELS/index.js";
const { Product, Order, Discount } = Models;

EXAMPLE CONTROLLER:

import { Product, Order, Discount } from "../MODELS/index.js";

export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name slug')
            .populate('seller', 'fullName email');
        
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createOrder = async (req, res) => {
    try {
        const order = await Order.create({
            ...req.body,
            customer: req.user.id
        });
        
        // Populate order items
        await order.populate('items.product');
        
        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
*/
