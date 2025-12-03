import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan"
import errorMiddleware from "./MIDDLEWARES/error.middleware.js";

import userRoute from './ROUTES/user.route.js'
import categoryRoute from './ROUTES/category.route.js'
import productRoute from './ROUTES/product.route.js';
import orderRoute from './ROUTES/order.route.js'
import inventoryRoute from './ROUTES/inventory.route.js'
import pricingRoute from './ROUTES/pricing.route.js'
import paymentRoute from './ROUTES/payment.route.js'
import discountRoute from './ROUTES/discount.route.js'
import analyticsRoute from './ROUTES/analytics.route.js'

const app = express();
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173', // ✅ Add fallback
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // ✅ Include OPTIONS
        allowedHeaders: ["Content-Type", "Authorization"],
        optionsSuccessStatus: 200 // ✅ Add this for older browsers
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use(morgan('dev'));


app.get('/health',(req,res)=>{
    res.status(200).json({
        success:true,
        message:'health check!'
    })
})

//all route
app.use('/api/v1/user',userRoute);
app.use('/api/v1/category',categoryRoute);
app.use('/api/v1/product',productRoute);
 app.use('/api/v1/order',orderRoute);
 app.use('/api/v1/inventory',inventoryRoute);
app.use('/api/v1/pricing',pricingRoute);
app.use('/api/v1/payments',paymentRoute);
app.use('/api/v1/discount',discountRoute);
app.use('/api/v1/analytics',analyticsRoute);

app.use(errorMiddleware)

export default app;