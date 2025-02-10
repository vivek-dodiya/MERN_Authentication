import ErrorHandler from '../../middlewares/error.js'
import { catchAsyncErrors } from '../../middlewares/catchAsyncErrors.js'
import { User } from '../../models/userModel.js'
import { sendEmail } from '../../utils/sendEmail.js'
import twilio from 'twilio'
import dotenv from 'dotenv';
import { sendToken } from '../../utils/sendToken.js'
import crypto from 'crypto'
dotenv.config();

const client = twilio(
    process.env.TWLIO_SID,
    process.env.TWLIO_AUTH_TOKEN,
);

export const register = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, phone, password, verificationMethod } = req.body;
        if (!name || !email || !phone || !password || !verificationMethod) {
            return next(new ErrorHandler('All Fields Are Required..', 400))
        }

        // Function for Validate Phone Number
        function validatePhoneNumber(phone) {
            const regex = /^(\+91[\s-]?)?[6-9]\d{9}$/
            return regex.test(phone);
        }
        if (!validatePhoneNumber(phone)) {
            return next(new ErrorHandler('Invalid Phone Number', 400));
        }

        // check User Already Exist
        const existinUser = await User.findOne({
            $or: [
                {
                    email,
                    accountVerified: true
                },
                {
                    phone,
                    accountVerified: true
                }
            ]
        });
        if (existinUser) {
            return next(new ErrorHandler('Phone Number Or Email Already Used..', 400))
        }

        const registerationAttemptsByUser = await User.find({
            $or: [
                {
                    email,
                    accountVerified: false
                },
                {
                    phone,
                    accountVerified: false
                }
            ]
        });
        if (registerationAttemptsByUser.length > 2) {
            return next(new ErrorHandler('You Have Exceeded The Maximum Number Of Attempts Try After an Hour', 400))
        }


        const user = await User.create({
            name,
            email,
            phone,
            password,
        });
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        sendVerificationCodeToUser(verificationMethod, verificationCode, email, phone, name, res);
    } catch (error) {
        next(error)
    }
})


async function sendVerificationCodeToUser(verificationMethod, verificationCode, email, phone, name, res) {
    try {
        if (verificationMethod === 'email') {
            const message = generateEmailTemplate(verificationCode, name);
            await sendEmail(
                email,
                "Your Verification Code",
                message
            );
            return res.status(201).json({
                message: `Hello ${name} Verification Code Sent To Your Email ${email}`,
            });
        } else if (verificationMethod === 'phone') {
            const verificationCodeWithSpace = verificationCode.toString().split("").join(" ");
            await client.calls.create({
                twiml: `<Response>
                    <Say>Hello ${name} Your verification code is ${verificationCodeWithSpace}.Hello ${name} Your verification code is ${verificationCodeWithSpace}</Say>
                    </Response>
                    `,
                from: process.env.TWLIO_PHONE_NUMBER,
                to: phone,
            });
            res.status(201).json({
                success: true,
                message: `Hello ${name} Verification Code Sent To Your Phone Number ${phone}`,
            });
        }
        else {
            throw new ErrorHandler('Invalid Verification Method', 400)
        }
    }
    catch (error) {
        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message: error.message || 'Verification Code Failed To Send',
        });
    };
};


function generateEmailTemplate(verificationCode, name) {
    return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🔑 Your Verification Code</h1>
            <p style="font-size: 16px; margin-top: 10px;">Secure your account in just a few steps</p>
        </div>
        <div style="padding: 25px;">
            <p style="font-size: 16px; color: #444;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">Thank you for signing up with us! Please use the following verification code to complete your registration:</p>
            <p style="font-size: 24px; font-weight: bold; color: #2575fc; text-align: center; border: 2px dashed #2575fc; padding: 15px; border-radius: 8px; background-color: #f3f7ff;">${verificationCode}</p>
            <p style="font-size: 16px; color: #666; line-height: 1.6;">This code is valid for <strong>5 minutes</strong>. If you didn’t request this code, please ignore this email. For any assistance, feel free to contact our support team.</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #ddd;">
            <p style="font-size: 14px; color: #999;">If you have any questions, visit our <a href="#" style="color: #2575fc; text-decoration: none;">Help Center</a> or contact us at vivekdodiya1510@gmail.com.</p>
            <p style="font-size: 14px; color: #aaa;">© 2025 Your Company. All rights reserved.</p>
        </div>
    </div>
    `;
};


export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
    const { otp, phone, email } = req.body;
    function validatePhoneNumber(phone) {
        const regex = /^(\+91[\s-]?)?[6-9]\d{9}$/
        return regex.test(phone);
    }
    if (!validatePhoneNumber(phone)) {
        return next(new ErrorHandler('Invalid Phone Number', 400));
    }

    try {
        const userAllEntries = await User.find({
            $or: [
                {
                    phone,
                    accountVerified: false
                },
                {
                    email,
                    accountVerified: false
                }
            ]
        }).sort({
            createdAt: -1
        });
        if (userAllEntries.length === 0 || !userAllEntries) {
            return next(
                new ErrorHandler('User Not Found', 404)
            )
        };
        let user;
        if (userAllEntries.length > 1) {
            user = userAllEntries[0];
            await User.deleteMany({
                _id: {
                    $ne: user._id
                },
                $or: [
                    {
                        phone,
                        accountVerified: false
                    },
                    {
                        email,
                        accountVerified: false
                    }
                ]
            })
        } else {
            user = userAllEntries[0];
        }
        if (user.verificationCode !== Number(otp)) {
            return next(new ErrorHandler("Invelid OTP", 400));
        };
        const currentTime = Date.now();
        const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();
        if (currentTime > verificationCodeExpire) {
            return next(new ErrorHandler("Verification code expired", 400));
        }

        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({ validateModifiOnly: true });

        sendToken(user, 200, "Account Verified", res);
    }
    catch (err) {
        next(new ErrorHandler(err.message, 500));
    }
});



export const login = catchAsyncErrors(async (req, res, next) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }
        const user = await User.findOne({ email, accountVerified: true }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        const isPassMatch = await user.comparePassword(password);
        if (!isPassMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        sendToken(user, 200, "Logged in successfully", res);
    }
    catch (err) {
        next(new ErrorHandler(err.message, 500));
    }
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true
        }).json({
            success: true,
            message: "Logged out successfully"
        })
    }
    catch (err) {
        next(new ErrorHandler(err.message, 500));
    }
});


export const getUser = catchAsyncErrors(async (req, res, next) => {
    try {
        const _id = req.user._id
        const user = await User.findById({ _id });
        res.status(200).json({
            success: true,
            user
        })
    }
    catch (err) {
        next(new ErrorHandler(err.message, 500))
    }
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(new ErrorHandler("Please provide your email", 400))
        }
        const user = await User.findOne({
            email,
            accountVerified: true
        });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        };
        const resetToken = await user.generateResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `You password reset token is: \n\n ${resetPasswordUrl} \n\n if you have not requested this email then please ignore it`;
        await sendEmail(
            user.email,
            'Password Reset Token',
            message
        );
        res.status(200).json({
            success: true,
            message: `Email sent successfully to ${user.email}`
        });
    }
    catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(err.message, 500))
    }

});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    try {
        const { token } = req.params;
        const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            return next(new ErrorHandler("Invalid token", 400));
        };
        if(req.body.password !== req.body.confermPassword){
            return next(new ErrorHandler("Password does not match", 400));
        };
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save()
        sendToken(user, 200, "Reset Password Successfully...", res)
    }
    catch (error) {
        next(new ErrorHandler(error.message, 500))
    }
})