// backend/CONTROLLERS/category.controller.js

import Category from "../models/category.model.js";

// ============================================
// CREATE CATEGORY
// ============================================
export const createCategory = async (req, res, next) => {
    try {
        const { name, description, parentCategory, commissionPercentage } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        // Check if category already exists
        const categoryExists = await Category.findOne({ 
            name: name.toLowerCase() 
        });

        if (categoryExists) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name,
            description,
            parentCategory,
            commissionPercentage
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL CATEGORIES
// ============================================
export const getCategories = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const categories = await Category.find({ isActive: true })
            .populate("parentCategory", "name")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ sortOrder: 1 });

        const total = await Category.countDocuments({ isActive: true });

        return res.status(200).json({
            success: true,
            categories,
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
// GET CATEGORY BY ID
// ============================================
export const getCategoryById = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId)
            .populate("parentCategory", "name");

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CATEGORY BY SLUG
// ============================================
export const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const category = await Category.findOne({ slug })
            .populate("parentCategory", "name");

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE CATEGORY
// ============================================
export const updateCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { name, description, parentCategory, commissionPercentage, sortOrder } = req.body;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (parentCategory !== undefined) category.parentCategory = parentCategory;
        if (commissionPercentage) category.commissionPercentage = commissionPercentage;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE CATEGORY
// ============================================
export const deleteCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await Category.findByIdAndDelete(categoryId);

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE CATEGORY ACTIVE
// ============================================
export const toggleCategoryActive = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.isActive = !category.isActive;
        await category.save();

        return res.status(200).json({
            success: true,
            message: `Category ${category.isActive ? "activated" : "deactivated"}`,
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SUBCATEGORIES
// ============================================
export const getSubcategories = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const subcategories = await Category.find({ 
            parentCategory: categoryId,
            isActive: true 
        });

        return res.status(200).json({
            success: true,
            subcategories
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET CATEGORY STATS
// ============================================
export const getCategoryStats = async (req, res, next) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // TODO: Fetch stats from Product model
        const stats = {
            totalProducts: category.totalProducts,
            commission: category.commissionPercentage,
            isActive: category.isActive
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
// SEARCH CATEGORIES
// ============================================
export const searchCategories = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const categories = await Category.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ],
            isActive: true
        });

        return res.status(200).json({
            success: true,
            categories
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
