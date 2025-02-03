import mongoose from "mongoose";
import bcrypt from 'bcrypt';

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
        minLength: [
            { value: 4, message: "Password must be at least 4 characters long" },
        ],
        maxLength: [
            { value: 8, message: "Password can not have more then 8 characters" },
        ],
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

export const User = mongoose.model('User', userSchema);

