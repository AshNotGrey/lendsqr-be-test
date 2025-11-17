/**
 * Swagger/OpenAPI 3.0 Configuration
 * 
 * This file defines the base configuration for the API documentation,
 * including server URLs, security schemes, and metadata.
 * 
 * @module docs/swagger.config
 */

import { Options } from "swagger-jsdoc";
import { config } from "../config/env";

/**
 * OpenAPI 3.0 Configuration
 * 
 * Defines the base structure for API documentation including:
 * - API metadata (title, version, description)
 * - Server configurations (development, production)
 * - Security schemes (Bearer JWT)
 * - Global tags for endpoint organization
 */
export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Lendsqr Demo Credit Wallet API",
    version: "1.0.0",
    description: `
      # Lendsqr Wallet Service API Documentation
      
      This is a comprehensive MVP wallet service API for Demo Credit mobile lending platform.
      
      ## Features
      - User account creation with Adjutor Karma blacklist verification
      - Wallet funding operations
      - Wallet withdrawal operations
      - Peer-to-peer fund transfers
      - Balance inquiries
      - Transaction idempotency via unique references
      
      ## Authentication
      All protected endpoints require a Bearer token obtained from signup or login.
      Click the "Authorize" button and enter your token in the format: \`Bearer <your-token>\`
      
      ## Transaction Idempotency
      Fund, withdraw, and transfer operations use a unique \`reference\` field to ensure 
      idempotent operations. The same reference cannot be used twice, preventing duplicate transactions.
      
      ## Database Transactions
      Wallet operations use MySQL transactions with row-level locking (\`SELECT ... FOR UPDATE\`)
      to ensure data consistency in concurrent scenarios.
    `,
    contact: {
      name: "Lendsqr Engineering",
      email: "careers@lendsqr.com",
      url: "https://lendsqr.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: config.nodeEnv === "production" 
        ? "https://your-production-domain.com" 
        : `http://localhost:${config.port}`,
      description: config.nodeEnv === "production" ? "Production Server" : "Development Server",
    },
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User registration and login endpoints",
    },
    {
      name: "Users",
      description: "User management endpoints",
    },
    {
      name: "Wallets",
      description: "Wallet operations (fund, withdraw, transfer, balance)",
    },
    {
      name: "Adjutor",
      description: "Adjutor Karma blacklist verification endpoints",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from signup or login endpoints",
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Authentication token is missing or invalid",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false,
                },
                error: {
                  type: "string",
                  example: "Unauthorized",
                },
                message: {
                  type: "string",
                  example: "Invalid or missing authentication token",
                },
              },
            },
          },
        },
      },
      NotFoundError: {
        description: "The requested resource was not found",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false,
                },
                error: {
                  type: "string",
                  example: "Not Found",
                },
                message: {
                  type: "string",
                  example: "Resource not found",
                },
              },
            },
          },
        },
      },
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false,
                },
                error: {
                  type: "string",
                  example: "Validation Error",
                },
                message: {
                  type: "string",
                  example: "Invalid request data",
                },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: {
                        type: "string",
                      },
                      message: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: false,
                },
                error: {
                  type: "string",
                  example: "Internal Server Error",
                },
                message: {
                  type: "string",
                  example: "An unexpected error occurred",
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Swagger-jsdoc Options
 * 
 * Configuration for automatic API documentation generation from JSDoc comments.
 * Scans route files and schema definitions to build complete OpenAPI specification.
 */
export const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: [
    "./src/routes/*.ts",
    "./src/docs/schemas/*.ts",
    "./dist/routes/*.js",
    "./dist/docs/schemas/*.js",
  ],
};

