import { catchAsyncErrors } from './catchAsyncErrors.js'
import ErrorHandler from './error.js'
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';


export const isAuthentication = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler('You are not logged in', 400));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded._id);
    if (!user) {
        return next(new ErrorHandler('User not found', 401));
    }
    req.user = user;
    next();
})