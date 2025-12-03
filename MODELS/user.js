import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";


const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Full name must be at least 3 characters long"],
        maxlength: [25, "Full name must be less than 25 characters"],
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minLength: [8, "Password must be at least 8 characters long"],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            default: ""
        },
        secure_url: {
            type: String,
            default: ""
        }
    },
    role: {
        type: String,
        enum: ["USER", "SELLER", "ADMIN"],
        default: "USER"
    },
    // Profile information
    bio: {
        type: String,
        maxlength: [500, "Bio must be less than 500 characters"],
        default: ""
    },
    phone: {
        type: String,
        default: "",
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^[0-9]{10}$/.test(v.replace(/\D/g, ""));
            },
            message: "Please enter a valid phone number"
        }
    },
    address: {
        street: {
            type: String,
            default: ""
        },
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        zipCode: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        }
    },
    // Social links
    socialLinks: {
        github: {
            type: String,
            default: "",
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(v);
                },
                message: "Invalid GitHub URL"
            }
        },
        linkedin: {
            type: String,
            default: "",
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+$/i.test(v);
                },
                message: "Invalid LinkedIn URL"
            }
        },
        twitter: {
            type: String,
            default: "",
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+\/?$/.test(v);
                },
                message: "Invalid Twitter/X URL"
            }
        },
        website: {
            type: String,
            default: "",
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/.+\..+/.test(v);
                },
                message: "Invalid website URL"
            }
        },
        instagram: {
            type: String,
            default: "",
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/?$/.test(v);
                },
                message: "Invalid Instagram URL"
            }
        }
    },
    // Business/Seller information
    businessProfile: {
        isCompleted: {
            type: Boolean,
            default: false
        },
        businessName: {
            type: String,
            default: "",
            maxlength: [100, "Business name must be less than 100 characters"]
        },
        businessType: {
            type: String,
            enum: ["individual", "partnership", "pvt_ltd", "public", "other"],
            default: "individual"
        },
        registrationNumber: {
            type: String,
            default: ""
        },
        taxId: {
            type: String,
            default: ""
        },
        bankAccount: {
            accountHolder: {
                type: String,
                default: ""
            },
            accountNumber: {
                type: String,
                default: ""
            },
            bankName: {
                type: String,
                default: ""
            },
            ifscCode: {
                type: String,
                default: ""
            },
            accountType: {
                type: String,
                enum: ["savings", "current"],
                default: "savings"
            }
        },
        commissionPercentage: {
            type: Number,
            default: 5,
            min: [0, "Commission cannot be negative"],
            max: [100, "Commission cannot exceed 100"]
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationDocuments: [{
            type: String,
            public_id: String,
            url: String,
            uploadedAt: Date
        }],
        verifiedAt: Date
    },
    // Customer profile (for USER role)
    customerProfile: {
        isCompleted: {
            type: Boolean,
            default: false
        },
        preferredLanguage: {
            type: String,
            enum: ["en", "hi", "es", "fr", "de", "ja", "zh"],
            default: "en"
        },
        preferredCurrency: {
            type: String,
            enum: ["INR", "USD", "EUR", "GBP", "JPY", "CNY"],
            default: "INR"
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
            min: [0, "Loyalty points cannot be negative"]
        },
        totalSpent: {
            type: Number,
            default: 0,
            min: [0, "Total spent cannot be negative"]
        },
        orderCount: {
            type: Number,
            default: 0
        },
        wishlist: [{
            type: Schema.Types.ObjectId,
            ref: "Product"
        }],
        defaultShippingAddress: {
            type: Schema.Types.ObjectId,
            default: null
        },
        defaultBillingAddress: {
            type: Schema.Types.ObjectId,
            default: null
        }
    },
    // Profile visibility
    isProfilePublic: {
        type: Boolean,
        default: true
    },
    // Account security
    twoFactorAuth: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        secret: {
            type: String,
            default: ""
        },
        backupCodes: [String]
    },
    // Password reset
    forgotPasswordToken: {
        type: String,
        default: ""
    },
    forgotPasswordExpiry: {
        type: Date,
        default: null
    },
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String,
        default: ""
    },
    bannedAt: Date,
    // Email verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: ""
    },
    emailVerificationExpiry: Date,
    // Authentication provider
    authProvider: {
        type: String,
        enum: ["email", "google", "facebook", "github"],
        default: "email"
    },
    authProviderIds: {
        google: {
            type: String,
            default: ""
        },
        facebook: {
            type: String,
            default: ""
        },
        github: {
            type: String,
            default: ""
        }
    },
    // Preferences
    preferences: {
        emailNotifications: {
            orders: { type: Boolean, default: true },
            promotions: { type: Boolean, default: true },
            news: { type: Boolean, default: false },
            reviews: { type: Boolean, default: true }
        },
        smsNotifications: {
            orders: { type: Boolean, default: false },
            promotions: { type: Boolean, default: false },
            security: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            enum: ["light", "dark", "auto"],
            default: "auto"
        }
    },
    // Last login
    lastLogin: Date,
    // Referral
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    referralCount: {
        type: Number,
        default: 0
    },
    // Metadata
    lastUpdated: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    deviceTokens: [String],  // For push notifications
    ipAddresses: [String]    // For security tracking


}, { timestamps: true });


// ============================================
// INDEXES
// ============================================


userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "businessProfile.isVerified": 1 });
userSchema.index({ "customerProfile.wishlist": 1 });


// ============================================
// PRE-SAVE HOOKS
// ============================================


// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return ;
    }
    try {
        this.password = await bcrypt.hash(this.password, 10);
        
    } catch (error) {
        console.error(`Error hashing password: ${error}`);
        next(error);
    }
});


// Generate referral code
userSchema.pre("save", function(next) {
    if (!this.referralCode) {
        this.referralCode = `REF-${this._id.toString().slice(0, 8).toUpperCase()}`;
    }
    this.lastUpdated = new Date();
    
});


// ============================================
// METHODS
// ============================================


// Generate JWT token
userSchema.methods.generateJWTToken = async function() {
    return await jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET || "your-secret-key",
        {
            expiresIn: process.env.JWT_EXPIRY || "7d"
        }
    );
};


// Compare password
userSchema.methods.comparePassword = async function(plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
};


// Generate password reset token
userSchema.methods.generatePasswordResetToken = async function() {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.forgotPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;  // 15 minutes
    return resetToken;
};


// Generate email verification token
userSchema.methods.generateEmailVerificationToken = async function() {
    const verificationToken = crypto.randomBytes(20).toString("hex");
    this.emailVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;  // 24 hours
    return verificationToken;
};


// Generate 2FA backup codes
userSchema.methods.generate2FABackupCodes = function() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    this.twoFactorAuth.backupCodes = codes;
    return codes;
};


// Add loyalty points
userSchema.methods.addLoyaltyPoints = function(points) {
    this.customerProfile.loyaltyPoints += points;
    return this.customerProfile.loyaltyPoints;
};


// Deduct loyalty points
userSchema.methods.deductLoyaltyPoints = function(points) {
    if (this.customerProfile.loyaltyPoints < points) {
        throw new Error("Insufficient loyalty points");
    }
    this.customerProfile.loyaltyPoints -= points;
    return this.customerProfile.loyaltyPoints;
};


// Add to wishlist
userSchema.methods.addToWishlist = function(productId) {
    if (!this.customerProfile.wishlist.includes(productId)) {
        this.customerProfile.wishlist.push(productId);
    }
    return this.customerProfile.wishlist;
};


// Remove from wishlist
userSchema.methods.removeFromWishlist = function(productId) {
    this.customerProfile.wishlist = this.customerProfile.wishlist.filter(
        id => id.toString() !== productId.toString()
    );
    return this.customerProfile.wishlist;
};


// Ban user
userSchema.methods.banUser = function(reason) {
    this.isBanned = true;
    this.banReason = reason;
    this.bannedAt = new Date();
    return this;
};


// Unban user
userSchema.methods.unbanUser = function() {
    this.isBanned = false;
    this.banReason = "";
    this.bannedAt = null;
    return this;
};


// Update last login
userSchema.methods.updateLastLogin = function(ipAddress) {
    this.lastLogin = new Date();
    this.loginCount += 1;
    if (ipAddress && !this.ipAddresses.includes(ipAddress)) {
        this.ipAddresses.push(ipAddress);
    }
    return this;
};


// Hide sensitive information
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.forgotPasswordToken;
    delete user.forgotPasswordExpiry;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpiry;
    // delete user.twoFactorAuth.secret;
    // delete user.twoFactorAuth.backupCodes;
    return user;
};


// ============================================
// STATIC METHODS
// ============================================


// Find by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};


// Find active users
userSchema.statics.findActive = function() {
    return this.find({ isActive: true, isBanned: false });
};


// Find sellers
userSchema.statics.findSellers = function() {
    return this.find({ role: "SELLER", isActive: true, isBanned: false });
};


// Find by referral code
userSchema.statics.findByReferralCode = function(referralCode) {
    return this.findOne({ referralCode });
};


// ✅ CORRECT (at the end of file)
export default mongoose.models.User || mongoose.model('User', userSchema);
