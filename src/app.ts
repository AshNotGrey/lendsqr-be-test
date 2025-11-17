/**
 * Express Application
 * 
 * This file configures the Express application with all middleware,
 * routes, and error handlers.
 * 
 * @module app
 */

import express, { Express, Request, Response, NextFunction } from "express";
import { config } from "./config/env";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import walletRoutes from "./routes/wallets";
import adjutorRoutes from "./routes/adjutor";

// Import middlewares
import { errorHandler } from "./middlewares/error";

/**
 * Create and configure Express application
 */
const app: Express = express();

/**
 * Global Middleware Configuration
 */

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Add security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Request logging middleware (development only)
if (config.nodeEnv === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * Health Check Endpoint
 * Used by deployment platforms and monitoring tools
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

/**
 * Root Endpoint
 * Provides basic API information
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Lendsqr Wallet Backend API",
    version: "1.0.0",
    documentation: "/api/v1",
    health: "/health",
  });
});

/**
 * API Routes (v1)
 * All API routes are prefixed with /api/v1
 */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/adjutor", adjutorRoutes);

// API root endpoint
app.get("/api/v1", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Lendsqr Wallet API v1",
    version: "1.0.0",
    endpoints: {
      auth: {
        signup: "POST /api/v1/auth/signup",
        login: "POST /api/v1/auth/login",
      },
      users: {
        getById: "GET /api/v1/users/:id",
      },
      wallets: {
        fund: "POST /api/v1/wallets/:userId/fund",
        withdraw: "POST /api/v1/wallets/:userId/withdraw",
        transfer: "POST /api/v1/wallets/transfer",
        balance: "GET /api/v1/wallets/:userId/balance",
      },
      adjutor: {
        checkKarma: "GET /api/v1/adjutor/karma/:identityType/:identity",
      },
    },
  });
});

/**
 * 404 Not Found Handler
 * Catches all unmatched routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
  });
});

/**
 * Global Error Handler
 * Catches all errors and sends appropriate responses
 */
app.use(errorHandler);

export default app;

