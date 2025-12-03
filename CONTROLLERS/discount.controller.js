// backend/CONTROLLERS/discount.controller.js

import Discount from "../CONFIG/discount.model.js";

// ============================================
// CREATE DISCOUNT
// ============================================
// export const createDiscount = async (req, res, next) => {
//     try {
//         const {
//             code,
//             type,
//             value,
//             description,
//             validFrom,
//             validUntil,
//             usageLimit,
//             maxDiscount,
//             applicableProducts,
//             applicableCategories,
//             restrictions
//         } = req.body;

//         if (!code || !type || !value) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Code, type and value are required"
//             });
//         }

//         // Check if discount code already exists
//         const discountExists = await Discount.findOne({ 
//             code: code.toUpperCase() 
//         });

//         if (discountExists) {
//             return res.status(409).json({
//                 success: false,
//                 message: "Discount code already exists"
//             });
//         }

//         const discount = await Discount.create({
//             code: code.toUpperCase(),
//             type,
//             value,
//             description,
//             validFrom,
//             validUntil,
//             usageLimit,
//             maxDiscount,
//             applicableProducts,
//             applicableCategories,
//             restrictions,
//             seller: req.user.role === "SELLER" ? req.user.id : null
//         });

//         return res.status(201).json({
//             success: true,
//             message: "Discount created successfully",
//             discount
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// ============================================
// CREATE DISCOUNT - FIXED
// ============================================
export const createDiscount = async (req, res, next) => {
    try {
        const {
            code,
            type,
            value,
            description,
            validFrom,
            validUntil,              // ✅ Changed from validTo to validUntil
            usageLimit,
            maxDiscount,
            applicableProducts,
            applicableCategories,
            restrictions
        } = req.body;

        // ✅ Validation
        if (!code || !type || !value) {
            return res.status(400).json({
                success: false,
                message: "Code, type and value are required"
            });
        }

        if (!validFrom || !validUntil) {
            return res.status(400).json({
                success: false,
                message: "validFrom and validUntil dates are required"
            });
        }

        // Check if discount code already exists
        const discountExists = await Discount.findOne({ 
            code: code.toUpperCase() 
        });

        if (discountExists) {
            return res.status(409).json({
                success: false,
                message: "Discount code already exists"
            });
        }

        const discount = await Discount.create({
            code: code.toUpperCase(),
            type,
            value,
            description,
            validFrom,
            validUntil,              // ✅ Use validUntil
            maxDiscount,
            applicableProducts,
            applicableCategories,
            restrictions: restrictions || {},
            createdBy: req.user.id,  // ✅ Auto-set from authenticated user
            isActive: true,
            isPublic: true
        });

        return res.status(201).json({
            success: true,
            message: "Discount created successfully",
            discount
        });

    } catch (error) {
        console.error('❌ Error in createDiscount:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ============================================
// GET ACTIVE DISCOUNTS
// ============================================
export const getActiveDiscounts = async (req, res, next) => {
    try {
        const now = new Date();

        const discounts = await Discount.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        });

        return res.status(200).json({
            success: true,
            discounts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DISCOUNTS
// ============================================
export const getDiscounts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = req.user.role === "SELLER" ? { seller: req.user.id } : {};

        const discounts = await Discount.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Discount.countDocuments(query);

        return res.status(200).json({
            success: true,
            discounts,
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
// GET DISCOUNT BY ID
// ============================================
export const getDiscountById = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        return res.status(200).json({
            success: true,
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DISCOUNT BY CODE
// ============================================
export const getDiscountByCode = async (req, res, next) => {
    try {
        const { code } = req.params;

        const discount = await Discount.findOne({ 
            code: code.toUpperCase() 
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount code not found"
            });
        }

        return res.status(200).json({
            success: true,
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE DISCOUNT
// ============================================
export const updateDiscount = async (req, res, next) => {
    try {
        const { discountId } = req.params;
        const { value, validUntil, usageLimit, description } = req.body;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        if (value) discount.value = value;
        if (validUntil) discount.validUntil = validUntil;
        if (usageLimit !== undefined) discount.usageLimit = usageLimit;
        if (description) discount.description = description;

        await discount.save();

        return res.status(200).json({
            success: true,
            message: "Discount updated successfully",
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE DISCOUNT
// ============================================
export const deleteDiscount = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        await Discount.findByIdAndDelete(discountId);

        return res.status(200).json({
            success: true,
            message: "Discount deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE DISCOUNT ACTIVE
// ============================================
export const toggleDiscountActive = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        discount.isActive = !discount.isActive;
        await discount.save();

        return res.status(200).json({
            success: true,
            message: `Discount ${discount.isActive ? "activated" : "deactivated"}`,
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// VALIDATE DISCOUNT
// ============================================
export const validateDiscount = async (req, res, next) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code || !cartTotal) {
            return res.status(400).json({
                success: false,
                message: "Code and cart total required"
            });
        }

        const discount = await Discount.findOne({ 
            code: code.toUpperCase() 
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Invalid discount code"
            });
        }

        if (!discount.isValid()) {
            return res.status(400).json({
                success: false,
                message: "Discount is expired or inactive"
            });
        }

        if (cartTotal < (discount.restrictions?.minimumCartValue || 0)) {
            return res.status(400).json({
                success: false,
                message: `Minimum cart value of ${discount.restrictions.minimumCartValue} required`
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === "percentage") {
            discountAmount = (cartTotal * discount.value) / 100;
            if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                discountAmount = discount.maxDiscount;
            }
        } else if (discount.type === "fixed") {
            discountAmount = discount.value;
        }

        return res.status(200).json({
            success: true,
            message: "Discount code is valid",
            discount: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discountAmount
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
// APPLY DISCOUNT
// ============================================
export const applyDiscount = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findByIdAndUpdate(
            discountId,
            { $inc: { usedCount: 1 } },
            { new: true }
        );

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Discount applied",
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DISCOUNT USAGE
// ============================================
export const getDiscountUsage = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        const usage = {
            total: discount.usageLimit,
            used: discount.usedCount,
            remaining: discount.usageLimit - discount.usedCount
        };

        return res.status(200).json({
            success: true,
            usage
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DISCOUNT STATS
// ============================================
export const getDiscountStats = async (req, res, next) => {
    try {
        const { discountId } = req.params;

        const discount = await Discount.findById(discountId);

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        const stats = {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            usageLimit: discount.usageLimit,
            usedCount: discount.usedCount,
            isActive: discount.isActive,
            validFrom: discount.validFrom,
            validUntil: discount.validUntil
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
// ADD CUSTOMERS TO DISCOUNT
// ============================================
export const addCustomersToDiscount = async (req, res, next) => {
    try {
        const { discountId } = req.params;
        const { customerIds } = req.body;

        const discount = await Discount.findByIdAndUpdate(
            discountId,
            { $addToSet: { applicableCustomers: { $each: customerIds } } },
            { new: true }
        );

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customers added to discount",
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REMOVE CUSTOMERS FROM DISCOUNT
// ============================================
export const removeCustomersFromDiscount = async (req, res, next) => {
    try {
        const { discountId } = req.params;
        const { customerIds } = req.body;

        const discount = await Discount.findByIdAndUpdate(
            discountId,
            { $pull: { applicableCustomers: { $in: customerIds } } },
            { new: true }
        );

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: "Discount not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customers removed from discount",
            discount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL DISCOUNTS (Admin)
// ============================================
export const getAllDiscounts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const discounts = await Discount.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Discount.countDocuments();

        return res.status(200).json({
            success: true,
            discounts,
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
// GET DISCOUNTS BY TYPE (Admin)
// ============================================
export const getDiscountsByType = async (req, res, next) => {
    try {
        const { type } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const discounts = await Discount.find({ type })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Discount.countDocuments({ type });

        return res.status(200).json({
            success: true,
            discounts,
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
// GET EXPIRING DISCOUNTS (Admin)
// ============================================
export const getExpiringDiscounts = async (req, res, next) => {
    try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const discounts = await Discount.find({
            validUntil: {
                $gte: now,
                $lte: sevenDaysFromNow
            }
        }).sort({ validUntil: 1 });

        return res.status(200).json({
            success: true,
            discounts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET DISCOUNT REPORT (Admin)
// ============================================
export const getDiscountReport = async (req, res, next) => {
    try {
        const totalDiscounts = await Discount.countDocuments();
        const activeDiscounts = await Discount.countDocuments({ isActive: true });

        const mostUsed = await Discount.find()
            .sort({ usedCount: -1 })
            .limit(5);

        const report = {
            totalDiscounts,
            activeDiscounts,
            inactiveDiscounts: totalDiscounts - activeDiscounts,
            mostUsed
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
// GET MY DISCOUNTS (Seller/Admin)
// ============================================
export const getMyDiscounts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // ✅ For sellers, get only their discounts
        // For admins, get all discounts
        const query = req.user.role === "SELLER" 
            ? { seller: req.user.id } 
            : {};

        const discounts = await Discount.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Discount.countDocuments(query);

        return res.status(200).json({
            success: true,
            discounts,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('❌ Error in getMyDiscounts:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
