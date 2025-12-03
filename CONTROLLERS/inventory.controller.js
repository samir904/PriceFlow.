// backend/CONTROLLERS/inventory.controller.js

import Inventory from "../models/Inventory.model.js";
import Product from "../models/Product.model.js";


// ============================================
// CREATE INVENTORY
// ============================================
export const createInventory = async (req, res, next) => {
    try {
        const { product, available, reserved, warehouse, reorderLevel } = req.body;

        if (!product || available === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product and available stock are required"
            });
        }

        // Check if product exists
        const productExists = await Product.findById(product);
        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if inventory already exists
        const inventoryExists = await Inventory.findOne({ product });
        if (inventoryExists) {
            return res.status(409).json({
                success: false,
                message: "Inventory already exists for this product"
            });
        }

        const inventory = await Inventory.create({
            product,
            available,
            reserved: reserved || 0,
            warehouse,
            reorderLevel,
            seller: req.user.id
        });

        await inventory.populate("product", "name sku");

        return res.status(201).json({
            success: true,
            message: "Inventory created successfully",
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET INVENTORY BY PRODUCT
// ============================================
export const getInventoryByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const inventory = await Inventory.findOne({ product: productId })
            .populate("product", "name sku");

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        return res.status(200).json({
            success: true,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE STOCK
// ============================================
export const updateStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { available, reserved } = req.body;

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        if (available !== undefined) inventory.available = available;
        if (reserved !== undefined) inventory.reserved = reserved;

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD STOCK
// ============================================
export const addStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity, reason } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        inventory.available += quantity;
        inventory.movements.push({
            type: "inbound",
            quantity,
            reason: reason || "Stock addition",
            date: new Date()
        });

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: `Added ${quantity} items to stock`,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REMOVE STOCK
// ============================================
export const removeStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity, reason } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        if (inventory.available < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        inventory.available -= quantity;
        inventory.movements.push({
            type: "outbound",
            quantity,
            reason: reason || "Stock removal",
            date: new Date()
        });

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: `Removed ${quantity} items from stock`,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADJUST STOCK
// ============================================
export const adjustStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity, reason } = req.body;

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const adjustment = quantity - (inventory.available + inventory.reserved);
        inventory.available = quantity;

        inventory.movements.push({
            type: "adjustment",
            quantity: Math.abs(adjustment),
            direction: adjustment > 0 ? "up" : "down",
            reason: reason || "Stock adjustment",
            date: new Date()
        });

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: "Stock adjusted successfully",
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET STOCK MOVEMENTS
// ============================================
export const getStockMovements = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        return res.status(200).json({
            success: true,
            movements: inventory.movements.reverse()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TRANSFER STOCK
// ============================================
export const transferStock = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity, toWarehouse } = req.body;

        if (!quantity || !toWarehouse) {
            return res.status(400).json({
                success: false,
                message: "Quantity and destination warehouse required"
            });
        }

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        if (inventory.available < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock for transfer"
            });
        }

        inventory.available -= quantity;
        inventory.movements.push({
            type: "transfer",
            quantity,
            fromWarehouse: inventory.warehouse,
            toWarehouse,
            reason: "Stock transfer",
            date: new Date()
        });

        inventory.warehouse = toWarehouse;
        await inventory.save();

        return res.status(200).json({
            success: true,
            message: `Transferred ${quantity} items to ${toWarehouse}`,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PERFORM PHYSICAL COUNT
// ============================================
export const performPhysicalCount = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { countedQuantity } = req.body;

        if (countedQuantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Counted quantity is required"
            });
        }

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const variance = countedQuantity - inventory.available;

        inventory.available = countedQuantity;
        inventory.lastPhysicalCount = new Date();
        inventory.movements.push({
            type: "physical_count",
            quantity: Math.abs(variance),
            direction: variance > 0 ? "up" : "down",
            variance,
            reason: "Physical inventory count",
            date: new Date()
        });

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: "Physical count completed",
            variance,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE REORDER SETTINGS
// ============================================
export const updateReorderSettings = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { reorderLevel, reorderQuantity } = req.body;

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        if (reorderLevel !== undefined) inventory.reorderLevel = reorderLevel;
        if (reorderQuantity !== undefined) inventory.reorderQuantity = reorderQuantity;

        await inventory.save();

        return res.status(200).json({
            success: true,
            message: "Reorder settings updated",
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE STOCK REPORT
// ============================================
export const generateStockReport = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const inventory = await Inventory.findOne({ product: productId })
            .populate("product", "name sku");

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const report = {
            product: inventory.product,
            available: inventory.available,
            reserved: inventory.reserved,
            total: inventory.available + inventory.reserved,
            warehouse: inventory.warehouse,
            reorderLevel: inventory.reorderLevel,
            needsReorder: inventory.available <= inventory.reorderLevel,
            lastPhysicalCount: inventory.lastPhysicalCount,
            movements: inventory.movements.slice(-10)
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
// GET INVENTORY STATS
// ============================================
export const getInventoryStats = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const inventory = await Inventory.findOne({ product: productId });

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const stats = {
            available: inventory.available,
            reserved: inventory.reserved,
            total: inventory.available + inventory.reserved,
            turnover: inventory.movements.length,
            lastMovement: inventory.movements[inventory.movements.length - 1]
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

// ============================================
// GET INVENTORY ALERTS
// ============================================
export const getInventoryAlerts = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const inventory = await Inventory.findOne({ product: productId })
            .populate("product", "name");

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found"
            });
        }

        const alerts = [];

        if (inventory.available === 0) {
            alerts.push({
                level: "critical",
                message: "Out of stock"
            });
        } else if (inventory.available <= inventory.reorderLevel) {
            alerts.push({
                level: "warning",
                message: "Stock below reorder level"
            });
        }

        return res.status(200).json({
            success: true,
            alerts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL INVENTORY (Admin)
// ============================================
export const getAllInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const inventory = await Inventory.find()
            .populate("product", "name sku")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Inventory.countDocuments();

        return res.status(200).json({
            success: true,
            inventory,
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
// GET INVENTORY
// ============================================
export const getInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const inventory = await Inventory.find()
            .populate("product", "name sku")
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Inventory.countDocuments();

        return res.status(200).json({
            success: true,
            inventory,
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
// GET LOW STOCK PRODUCTS (Admin)
// ============================================
export const getLowStockProducts = async (req, res, next) => {
    try {
        const lowStockItems = await Inventory.find({
            available: { $lte: "$reorderLevel" }
        }).populate("product", "name sku");

        return res.status(200).json({
            success: true,
            lowStockItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET OUT OF STOCK PRODUCTS (Admin)
// ============================================
export const getOutOfStockProducts = async (req, res, next) => {
    try {
        const outOfStockItems = await Inventory.find({
            available: 0
        }).populate("product", "name sku");

        return res.status(200).json({
            success: true,
            outOfStockItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET OVER STOCK PRODUCTS (Admin)
// ============================================
export const getOverStockProducts = async (req, res, next) => {
    try {
        const overStockItems = await Inventory.find({
            available: { $gte: 1000 } // Threshold can be configurable
        }).populate("product", "name sku");

        return res.status(200).json({
            success: true,
            overStockItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET INVENTORY BY WAREHOUSE (Admin)
// ============================================
export const getInventoryByWarehouse = async (req, res, next) => {
    try {
        const { warehouseId } = req.params;

        const inventory = await Inventory.find({ warehouse: warehouseId })
            .populate("product", "name sku");

        return res.status(200).json({
            success: true,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SLOW MOVING PRODUCTS (Admin)
// ============================================
export const getSlowMovingProducts = async (req, res, next) => {
    try {
        const slowMoving = await Inventory.find({
            movements: { $size: { $lt: 5 } }
        }).populate("product", "name sku");

        return res.status(200).json({
            success: true,
            slowMoving
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET FAST MOVING PRODUCTS (Admin)
// ============================================
export const getFastMovingProducts = async (req, res, next) => {
    try {
        const fastMoving = await Inventory.find({
            movements: { $size: { $gte: 20 } }
        }).populate("product", "name sku");

        return res.status(200).json({
            success: true,
            fastMoving
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
