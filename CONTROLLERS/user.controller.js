// backend/CONTROLLERS/user.controller.js

import User from "../MODELS/User.model.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import { cookieoptions } from "../UTILS/cookieOption.js";
import Apperror from "../UTILS/error.util.js";

// ============================================
// REGISTER USER
// ============================================
export const register = async (req, res, next) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Create user
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            role: role || "USER"
        });

        // Generate verification token
        // const verificationToken = await user.generateEmailVerificationToken();
        
        await user.save();
        user.password=undefined;

const token=await user.generateJWTToken();
    res.cookie('token',token,cookieoptions);

        // TODO: Send verification email

        return res.status(201).json({
            success: true,
            message: "User registered successfully. ",
            user: user.toJSON()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// LOGIN USER
// ============================================
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // Find user with password (select: false)
        const user = await User.findOne({ email: email.toLowerCase() })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: `Account banned. Reason: ${user.banReason}`
            });
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = await user.generateJWTToken();
         // Update last login
        user.updateLastLogin(req.ip);
        await user.save();

        // Set cookie
        res.cookie("token", token,cookieoptions);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: user.toJSON()
        });

    } catch (error) {
        return next(new Apperror(error.message,500))
    }
};

// ============================================
// LOGOUT USER
// ============================================
export const logout = async (req, res, next) => {
    try {
        res.clearCookie("token");

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET USER PROFILE
// ============================================
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("customerProfile.wishlist", "name slug pricing.sellingPrice avatar");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE PROFILE
// ============================================
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, bio, phone, address, socialLinks, preferences } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (bio) user.bio = bio;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        // Handle avatar upload
        if (req.files && req.files.avatar) {
            const avatar = req.files.avatar;

            // Delete old avatar if exists
            if (user.avatar.public_id) {
                await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            }

            // Upload new avatar
            const result = await cloudinary.v2.uploader.upload(avatar.tempFilePath, {
                folder: "users/avatars",
                width: 200,
                height: 200,
                gravity: "face",
                crop: "thumb"
            });

            user.avatar = {
                public_id: result.public_id,
                secure_url: result.secure_url
            };

            // Clean temp file
            await fs.unlink(avatar.tempFilePath);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: user.toJSON()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const user = await User.findById(req.user.id).select("+password");

        // Verify old password
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// FORGOT PASSWORD
// ============================================
//for now leave it ok let only change password available ok 
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide email address"
            });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            });
        }

        // Generate reset token
        const resetToken = await user.generatePasswordResetToken();
        await user.save();

        // TODO: Send reset email with token

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// RESET PASSWORD
// ============================================
//for now leave it ok 
export const resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;
        const { newPassword, confirmPassword } = req.body;

        // Validation
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide password and confirm password"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Hash token to match
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Find user with valid token
        const user = await User.findOne({
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Update password
        user.password = newPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// VERIFY EMAIL
// ============================================
//for now leave it ok 
export const verifyEmail = async (req, res, next) => {
    try {
        const { verificationToken } = req.params;

        // Hash token to match
        const hashedToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        // Find user
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GENERATE VERIFICATION TOKEN
// ============================================
//for now leave it ok
export const generateVerificationToken = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        // Generate new verification token
        const verificationToken = await user.generateEmailVerificationToken();
        await user.save();

        // TODO: Send verification email

        return res.status(200).json({
            success: true,
            message: "Verification email sent"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ENABLE 2FA
// ============================================
//for now leave it ok 
export const enable2FA = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate backup codes
        const backupCodes = user.generate2FABackupCodes();
        user.twoFactorAuth.isEnabled = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "2FA enabled successfully",
            backupCodes
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// VERIFY 2FA
// ============================================
//for now leave it ok 
export const verify2FA = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Please provide 2FA code"
            });
        }

        const user = await User.findById(req.user.id);

        // TODO: Verify 2FA code with library like speakeasy

        return res.status(200).json({
            success: true,
            message: "2FA verified successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD TO WISHLIST
// ============================================
export const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.addToWishlist(productId);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REMOVE FROM WISHLIST
// ============================================
export const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.removeFromWishlist(productId);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET WISHLIST
// ============================================
export const getWishlist = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("customerProfile.wishlist");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            wishlist: user.customerProfile.wishlist
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ADD LOYALTY POINTS (Admin)
// ============================================
export const addLoyaltyPoints = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { points } = req.body;

        if (!points) {
            return res.status(400).json({
                success: false,
                message: "Please provide points"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const newPoints = user.addLoyaltyPoints(points);
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Added ${points} loyalty points`,
            loyaltyPoints: newPoints
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DEDUCT LOYALTY POINTS (Admin)
// ============================================
export const deductLoyaltyPoints = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { points } = req.body;

        if (!points) {
            return res.status(400).json({
                success: false,
                message: "Please provide points"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const remainingPoints = user.deductLoyaltyPoints(points);
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Deducted ${points} loyalty points`,
            loyaltyPoints: remainingPoints
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET LOYALTY BALANCE
// ============================================
export const getLoyaltyBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            loyaltyPoints: user.customerProfile.loyaltyPoints
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET BUSINESS PROFILE
// ============================================
export const getBusinessProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        return res.status(200).json({
            success: true,
            businessProfile: user.businessProfile
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE BUSINESS PROFILE
// ============================================
export const updateBusinessProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        const { businessName, businessType, registrationNumber, taxId, bankAccount } = req.body;

        if (businessName) user.businessProfile.businessName = businessName;
        if (businessType) user.businessProfile.businessType = businessType;
        if (registrationNumber) user.businessProfile.registrationNumber = registrationNumber;
        if (taxId) user.businessProfile.taxId = taxId;
        if (bankAccount) user.businessProfile.bankAccount = bankAccount;

        user.businessProfile.isCompleted = true;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Business profile updated",
            businessProfile: user.businessProfile
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPLOAD VERIFICATION DOCUMENTS
// ============================================
export const uploadVerificationDocuments = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.role !== "SELLER") {
            return res.status(403).json({
                success: false,
                message: "Not authorized"
            });
        }

        if (!req.files || !req.files.documents) {
            return res.status(400).json({
                success: false,
                message: "Please provide documents"
            });
        }

        const files = Array.isArray(req.files.documents) 
            ? req.files.documents 
            : [req.files.documents];

        const uploadedDocs = [];

        for (const file of files) {
            const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
                folder: "verification-docs",
                resource_type: "auto"
            });

            uploadedDocs.push({
                public_id: result.public_id,
                url: result.secure_url,
                uploadedAt: new Date()
            });

            await fs.unlink(file.tempFilePath);
        }

        user.businessProfile.verificationDocuments.push(...uploadedDocs);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Documents uploaded successfully",
            documents: uploadedDocs
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL USERS (Admin)
// ============================================
export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            users,
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
// GET USER BY ID (Admin)
// ============================================
export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// BAN USER (Admin)
// ============================================
export const banUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.banUser(reason || "No reason provided");
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User banned successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UNBAN USER (Admin)
// ============================================
export const unbanUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.unbanUser();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User unbanned successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE USER ROLE (Admin)
// ============================================
export const updateUserRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Please provide role"
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User role updated",
            user: user.toJSON()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE USER (Admin)
// ============================================
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Delete avatar if exists
        if (user.avatar.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        // Delete verification documents
        if (user.businessProfile.verificationDocuments.length > 0) {
            for (const doc of user.businessProfile.verificationDocuments) {
                await cloudinary.v2.uploader.destroy(doc.public_id);
            }
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
