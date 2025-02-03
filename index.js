import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
dotenv.config()
const app = express();
const port = process.env.PORT || 4000;
import {connection}  from './config/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';

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

app.use(errorMiddleware)

app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})