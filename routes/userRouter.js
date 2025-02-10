import express from 'express'
const userRouter = express.Router();
import { forgotPassword, getUser, login, logout, register, resetPassword, verifyOTP } from '../controllers/userControllers/userControllers.js';
import { isAuthentication } from '../middlewares/auth.js';

// API PATH :-   http://localhost:3000/api/v1/user/register
userRouter.post('/register', register);

// API PATH :-   http://localhost:3000/api/v1/user/verify_OTP
userRouter.post('/verify-OTP', verifyOTP)

// API PATH :-   http://localhost:3000/api/v1/user/login
userRouter.post('/login', login)

// API PATH :-   http://localhost:3000/api/v1/user/log-out
userRouter.get('/log-out', isAuthentication,logout)

// API PATH :-   http://localhost:3000/api/v1/user/get-user
userRouter.get('/get-user', isAuthentication, getUser);

// API PATH :-   http://localhost:3000/api/v1/user/forgot-password
userRouter.post('/forgot-password', forgotPassword);

// API PATH :-   http://localhost:3000/api/v1/user/reset-password/:token
userRouter.put('/reset-password/:token', resetPassword);
export default userRouter