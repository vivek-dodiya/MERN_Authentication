import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 100,
        select: false
    },
    phone: {
        type: String,
        required: true
    },
    accountVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: Number
    },
    verificationCodeExpire: {
        type: Date
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.pre('save',
    async function (next) {
        if (!this.isModified('password')) {
            next();
            return;
        }
        this.password = await bcrypt.hash(this.password, 10);
        next();
    }
);

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateVerificationCode = function () {
    function generateRendomFiveDigitNumber() {
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigit = Math.floor(Math.random() * 10000).toString().padStart(4, 0);
        return parseInt(firstDigit + remainingDigit);
    }
    const generatedVerificationCode = generateRendomFiveDigitNumber();

    this.verificationCode = generatedVerificationCode;
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000

    return generatedVerificationCode;
}

userSchema.methods.generateToken = async function () {
    return await jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE_IN  });
};

userSchema.methods.generateResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000
    return resetToken;
}

export const User = mongoose.model('User', userSchema);

