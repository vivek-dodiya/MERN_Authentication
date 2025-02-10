import express from 'express';
const app = express();
import dotenv from 'dotenv';
dotenv.config()
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {connection}  from './config/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';
import userRouter from './routes/userRouter.js';
const port = process.env.PORT || 4000;
import { removeUnverifiedAccounts } from './automation/removeUnverifiedAccount.js';
removeUnverifiedAccounts()
connection()

app.use(cors(({
    origin: [process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
})));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))


//  User Router
//   http://localhost:300/api/v1/user
app.use(errorMiddleware)
app.use('/api/v1/user', userRouter);

app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})