// backend/CONTROLLERS/pricing.controller.js

import PricingStrategy from "../MODELS/PricingStrategy.model.js";
import Product from "../MODELS/Product.model.js";

// ============================================
// CREATE PRICING STRATEGY
// ============================================
export const createPricingStrategy = async (req, res, next) => {
    try {
        const {
            name,
            type,
            basePrice,
            rules,
            applicableProducts,
            applicableCategories,
            validFrom,
            validUntil
        } = req.body;

        if (!name || !type || !basePrice) {
            return res.status(400).json({
                success: false,
                message: "Name, type and base price are required"
            });
        }

        const strategy = await PricingStrategy.create({
            name,
            type,
            basePrice,
            rules,
            applicableProducts,
            applicableCategories,
            validFrom,
            validUntil,
            seller: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Pricing strategy created successfully",
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICING STRATEGIES
// ============================================
export const getPricingStrategies = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const strategies = await PricingStrategy.find({ seller: req.user.id })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await PricingStrategy.countDocuments({ seller: req.user.id });

        return res.status(200).json({
            success: true,
            strategies,
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
// GET PRICING STRATEGY BY ID
// ============================================
export const getPricingStrategyById = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        return res.status(200).json({
            success: true,
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICING STRATEGY BY PRODUCT
// ============================================
export const getPricingStrategyByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const strategy = await PricingStrategy.findOne({
            applicableProducts: productId,
            isActive: true
        });

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "No pricing strategy found for this product"
            });
        }

        return res.status(200).json({
            success: true,
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PRICING STRATEGY
// ============================================
export const updatePricingStrategy = async (req, res, next) => {
    try {
        const { strategyId } = req.params;
        const { name, basePrice, rules, validUntil } = req.body;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        if (name) strategy.name = name;
        if (basePrice) strategy.basePrice = basePrice;
        if (rules) strategy.rules = rules;
        if (validUntil) strategy.validUntil = validUntil;

        await strategy.save();

        return res.status(200).json({
            success: true,
            message: "Pricing strategy updated",
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE PRICING STRATEGY
// ============================================
export const deletePricingStrategy = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        await PricingStrategy.findByIdAndDelete(strategyId);

        return res.status(200).json({
            success: true,
            message: "Pricing strategy deleted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE STRATEGY ACTIVE
// ============================================
export const toggleStrategyActive = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        strategy.isActive = !strategy.isActive;
        await strategy.save();

        return res.status(200).json({
            success: true,
            message: `Strategy ${strategy.isActive ? "activated" : "deactivated"}`,
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CALCULATE PRICE
// ============================================
export const calculatePrice = async (req, res, next) => {
    try {
        const { productId, quantity, strategyId } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let price = product.pricing.sellingPrice;
        let discount = 0;

        if (strategyId) {
            const strategy = await PricingStrategy.findById(strategyId);

            if (strategy && strategy.type === "percentage") {
                discount = (price * strategy.basePrice) / 100;
            } else if (strategy && strategy.type === "fixed") {
                discount = strategy.basePrice;
            } else if (strategy && strategy.type === "tiered" && quantity) {
                // Apply tiered pricing based on quantity
                strategy.rules.forEach(rule => {
                    if (quantity >= rule.minQuantity && quantity <= rule.maxQuantity) {
                        discount = (price * rule.discountPercentage) / 100;
                    }
                });
            }
        }

        const finalPrice = price - discount;
        const totalAmount = finalPrice * (quantity || 1);

        return res.status(200).json({
            success: true,
            pricing: {
                basePrice: price,
                discount,
                finalPrice,
                quantity: quantity || 1,
                totalAmount
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
// GET DYNAMIC PRICE
// ============================================
export const getDynamicPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Implement dynamic pricing based on demand, time, etc.
        
        return res.status(200).json({
            success: true,
            price: product.pricing.sellingPrice
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET TIERED PRICE
// ============================================
export const getTieredPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const tierPricing = [
            { min: 1, max: 10, discount: 0 },
            { min: 11, max: 50, discount: 5 },
            { min: 51, max: 100, discount: 10 },
            { min: 101, max: 500, discount: 15 },
            { min: 501, max: 1000, discount: 20 }
        ];

        let discount = 0;
        tierPricing.forEach(tier => {
            if (quantity >= tier.min && quantity <= tier.max) {
                discount = tier.discount;
            }
        });

        const finalPrice = product.pricing.sellingPrice * (1 - discount / 100);

        return res.status(200).json({
            success: true,
            tieredPricing: {
                basePrice: product.pricing.sellingPrice,
                quantity,
                discountPercentage: discount,
                finalPrice,
                totalAmount: finalPrice * quantity
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
// GET SEASONAL PRICE
// ============================================
export const getSeasonalPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const month = new Date().getMonth();
        let seasonalMultiplier = 1;

        // Example seasonal pricing
        if (month >= 11 || month <= 1) { // Winter
            seasonalMultiplier = 1.2;
        } else if (month >= 5 && month <= 8) { // Summer
            seasonalMultiplier = 1.1;
        }

        const seasonalPrice = product.pricing.sellingPrice * seasonalMultiplier;

        return res.status(200).json({
            success: true,
            seasonalPricing: {
                basePrice: product.pricing.sellingPrice,
                season: ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer", "Summer", "Summer", "Fall", "Fall", "Fall", "Winter"][month],
                multiplier: seasonalMultiplier,
                seasonalPrice
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
// GET PSYCHOLOGICAL PRICE
// ============================================
export const getPsychologicalPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Charm pricing: end with .99
        const charmPrice = Math.floor(product.pricing.sellingPrice) + 0.99;

        return res.status(200).json({
            success: true,
            psychologicalPricing: {
                basePrice: product.pricing.sellingPrice,
                charmPrice,
                estimatedConversionIncrease: "15-20%"
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
// GET COMPETITIVE PRICE
// ============================================
export const getCompetitivePrice = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Fetch competitor prices and suggest competitive pricing

        return res.status(200).json({
            success: true,
            competitivePricing: {
                currentPrice: product.pricing.sellingPrice,
                message: "Competitive analysis coming soon"
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
// APPLY PRICING STRATEGY
// ============================================
export const applyPricingStrategy = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findByIdAndUpdate(
            strategyId,
            { isActive: true, appliedAt: new Date() },
            { new: true }
        );

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pricing strategy applied",
            strategy
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICING METRICS
// ============================================
export const getPricingMetrics = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        const metrics = {
            strategyId,
            type: strategy.type,
            appliedProducts: strategy.applicableProducts.length,
            isActive: strategy.isActive,
            createdAt: strategy.createdAt
        };

        return res.status(200).json({
            success: true,
            metrics
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET STRATEGY PERFORMANCE
// ============================================
export const getStrategyPerformance = async (req, res, next) => {
    try {
        const { strategyId } = req.params;

        const strategy = await PricingStrategy.findById(strategyId);

        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: "Pricing strategy not found"
            });
        }

        // TODO: Calculate performance metrics based on sales

        const performance = {
            strategyId,
            conversionRate: "0%",
            revenueImpact: "0%",
            message: "Performance data coming soon"
        };

        return res.status(200).json({
            success: true,
            performance
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// OPTIMIZE PRICE
// ============================================
export const optimizePrice = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // TODO: Use ML/algorithm to optimize price for maximum revenue

        const optimization = {
            currentPrice: product.pricing.sellingPrice,
            suggestedPrice: product.pricing.sellingPrice,
            estimatedRevenueIncrease: "0%",
            confidence: "0%"
        };

        return res.status(200).json({
            success: true,
            optimization
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// SIMULATE PRICING
// ============================================
export const simulatePricing = async (req, res, next) => {
    try {
        const { productId, newPrice } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const priceChange = ((newPrice - product.pricing.sellingPrice) / product.pricing.sellingPrice * 100).toFixed(2);

        const simulation = {
            currentPrice: product.pricing.sellingPrice,
            newPrice,
            priceChange: `${priceChange}%`,
            estimatedImpact: "Impact simulation coming soon"
        };

        return res.status(200).json({
            success: true,
            simulation
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ACTIVE STRATEGIES
// ============================================
export const getActiveStrategies = async (req, res, next) => {
    try {
        const strategies = await PricingStrategy.find({ 
            seller: req.user.id,
            isActive: true 
        });

        return res.status(200).json({
            success: true,
            strategies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET STRATEGIES BY TYPE
// ============================================
export const getStrategiesByType = async (req, res, next) => {
    try {
        const { type } = req.params;

        const strategies = await PricingStrategy.find({ 
            seller: req.user.id,
            type 
        });

        return res.status(200).json({
            success: true,
            strategies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PRICE HISTORY
// ============================================
export const getPriceHistory = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const history = {
            productId,
            currentPrice: product.pricing.sellingPrice,
            priceHistory: [
                { date: new Date(), price: product.pricing.sellingPrice }
            ]
        };

        return res.status(200).json({
            success: true,
            history
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL STRATEGIES (Admin)
// ============================================
export const getAllStrategies = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const strategies = await PricingStrategy.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await PricingStrategy.countDocuments();

        return res.status(200).json({
            success: true,
            strategies,
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
// COMPARE STRATEGIES (Admin)
// ============================================
export const compareStrategies = async (req, res, next) => {
    try {
        const { strategyIds } = req.body;

        const strategies = await PricingStrategy.find({ _id: { $in: strategyIds } });

        return res.status(200).json({
            success: true,
            strategies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
