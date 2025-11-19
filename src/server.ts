/**
 * Server Entry Point
 * 
 * This file initializes and starts the HTTP server.
 * It handles database initialization, graceful shutdown, and error handling.
 * 
 * @module server
 */

import app from "./app";
import { config } from "./config/env";
import { initializeDatabase, closeConnection } from "./db";

/**
 * Start the HTTP server
 * 
 * This function:
 * 1. Initializes the database connection
 * 2. Starts the HTTP server
 * 3. Sets up graceful shutdown handlers
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database
    console.log("🔄 Initializing database...");
    await initializeDatabase();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log("\n🚀 Lendsqr Wallet Backend Server Started");
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   URL: ${config.publicUrl}`);
      console.log(`   API: ${config.publicUrl}/api/v1`);
      console.log(`   📚 Swagger UI: ${config.publicUrl}/api-docs`);
      console.log("\n✅ Server is ready to accept connections\n");
    });

    /**
     * Graceful shutdown handler
     * 
     * Closes all connections properly when the process receives
     * termination signals (SIGTERM, SIGINT)
     */
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log("✅ HTTP server closed");

        try {
          // Close database connections
          await closeConnection();

          console.log("✅ Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      console.error("❌ Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any) => {
      console.error("❌ Unhandled Rejection:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

