import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware.js';

// Import Routes
import userRoutes from './routes/user.routes.js';
import teamRoutes from './routes/team.routes.js';
import eventRoutes from './routes/event.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { DB_NAME } from './constants.js';

// Initialize Express app
const app = express();

// Database Connection
const connectDB=async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log("mongodb connected\n",connectionInstance.connection.host,connectionInstance.connection.name);

    } catch (error) {
        console.log("mongodb error",error);
        
    }
}
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cookieParser()); // Parser for cookies

// Request logger middleware
app.use((req, res, next) => {
  console.log('--- New Request ---');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Body:', req.body);
  console.log('-------------------');
  next();
});

// --- API ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// --- ERROR HANDLER MIDDLEWARE ---
// This must be the last piece of middleware loaded
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});