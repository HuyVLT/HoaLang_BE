import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import passport from 'passport';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { connectDB } from './config/database';
import './config/passport'; // Loads Passport strategy configurations
import authRoutes from './modules/auth/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';
import { sendResponse } from './utils/response';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting security layer
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendResponse(res, 429, false, null, 'Too many requests from this IP address. Please try again in 15 minutes.');
  }
});
app.use('/api', limiter);

// Initialize passport strategies
app.use(passport.initialize());

// Configure and attach interactive Swagger Explorer
setupSwagger(app);

// Wire API module routes
app.use('/api/v1/auth', authRoutes);

// Fallback page not found (404)
app.use((req, res): void => {
  sendResponse(res, 404, false, null, `Route resource ${req.originalUrl} not found.`);
});

// Centralized error interceptor handler
app.use(errorHandler);

// Establish database connection and start listening
const bootExpressApp = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Express server is active and running on: http://localhost:${PORT}`);
  });
};

bootExpressApp().catch((err) => {
  console.error('Fatal crash on bootstrapping application:', err);
});
