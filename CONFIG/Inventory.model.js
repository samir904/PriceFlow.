// backend/MODELS/Inventory.model.js

import { Schema, model } from "mongoose";

const inventorySchema = new Schema({
    // Product reference
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
        unique: true
    },

    // SKU
    sku: {
        type: String,
        required: true,
        unique: true
    },

    // Stock quantities
    stock: {
        // Available for sale
        available: {
            type: Number,
            required: true,
            min: [0, "Available stock cannot be negative"],
            default: 0
        },

        // Reserved/pending
        reserved: {
            type: Number,
            default: 0,
            min: [0, "Reserved stock cannot be negative"]
        },

        // Defective/damaged
        defective: {
            type: Number,
            default: 0,
            min: [0, "Defective stock cannot be negative"]
        },

        // Total stock (calculated)
        total: {
            type: Number,
            default: 0
        }
    },

    // Warehouse locations
    warehouse: [{
        location: String,
        quantity: {
            type: Number,
            default: 0
        },
        lastUpdated: Date
    }],

    // Reorder settings
    reorder: {
        // Minimum stock level
        minimumLevel: {
            type: Number,
            required: true,
            default: 10
        },

        // Reorder point
        reorderPoint: {
            type: Number,
            required: true,
            default: 20
        },

        // Reorder quantity
        reorderQuantity: {
            type: Number,
            required: true,
            default: 50
        },

        // Lead time (days)
        leadTime: {
            type: Number,
            default: 7
        }
    },

    // Stock movements/history
    movements: [{
        type: {
            type: String,
            enum: ["inbound", "outbound", "adjustment", "return", "damage", "sample"],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        reference: String,  // Order ID, PO ID, etc.
        reason: String,
        movedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Stock alerts
    alerts: {
        lowStockAlert: {
            type: Boolean,
            default: false
        },
        outOfStockAlert: {
            type: Boolean,
            default: false
        },
        overStockAlert: {
            type: Boolean,
            default: false
        }
    },

    // Turnover metrics
    metrics: {
        // Days of stock remaining
        daysOfStock: Number,

        // Stock turnover rate
        turnoverRate: Number,

        // Average daily sales
        averageDailySales: Number,

        // Slow-moving product
        isSlowMoving: {
            type: Boolean,
            default: false
        },

        // Fast-moving product
        isFastMoving: {
            type: Boolean,
            default: false
        }
    },

    // Cost information
    cost: {
        // Unit cost
        unitCost: Number,

        // Total inventory cost
        totalInventoryCost: Number,

        // Last updated cost
        lastCostUpdate: Date
    },

    // Last physical count
    lastPhysicalCount: {
        date: Date,
        variance: Number,  // Difference between system and actual
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }

}, { timestamps: true });

// Indexes
inventorySchema.index({ product: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ "stock.available": 1 });
inventorySchema.index({ "alerts.lowStockAlert": 1 });

// Calculate total stock
inventorySchema.pre("save", function(next) {
    this.stock.total = this.stock.available + this.stock.reserved + this.stock.defective;
    next();
});

// Reorder level methods
inventorySchema.methods.isLowStock = function() {
    return this.stock.available <= this.reorder.minimumLevel;
};

inventorySchema.methods.needsReorder = function() {
    return this.stock.available <= this.reorder.reorderPoint;
};

inventorySchema.methods.addStock = function(quantity, reference, reason) {
    this.stock.available += quantity;
    this.movements.push({
        type: "inbound",
        quantity,
        reference,
        reason: reason || "Stock received"
    });
};

inventorySchema.methods.removeStock = function(quantity, reference, reason) {
    if (this.stock.available < quantity) {
        throw new Error("Insufficient stock available");
    }
    this.stock.available -= quantity;
    this.movements.push({
        type: "outbound",
        quantity,
        reference,
        reason: reason || "Stock removed"
    });
};

const Inventory = model("Inventory", inventorySchema);
export default Inventory;
