/**
 * Swagger Documentation Setup
 * 
 * This module initializes and configures Swagger UI for the API documentation.
 * It generates the OpenAPI specification from JSDoc comments and schema definitions.
 * 
 * @module docs
 */

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./swagger.config";

/**
 * Generate OpenAPI specification from JSDoc comments
 * 
 * Uses swagger-jsdoc to parse route files and schema definitions,
 * combining them with the base configuration to create a complete
 * OpenAPI 3.0 specification.
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI Express configuration options
 * 
 * Customizes the Swagger UI interface with enhanced features:
 * - Deep linking for sharing specific endpoints
 * - Request/response interception display
 * - Persistent authorization
 * - Custom branding
 */
export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info { 
      margin: 20px 0; 
    }
    .swagger-ui .info .title { 
      color: #0055ff;
      font-size: 2em;
    }
    .swagger-ui .scheme-container { 
      background: #f7f7f7; 
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .swagger-ui .opblock-tag {
      font-size: 1.2em;
      font-weight: 600;
      color: #333;
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73, 204, 144, 0.1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe;
      background: rgba(97, 175, 254, 0.1);
    }
    .swagger-ui .btn.authorize {
      background-color: #0055ff;
      border-color: #0055ff;
    }
    .swagger-ui .btn.execute {
      background-color: #49cc90;
      border-color: #49cc90;
    }
  `,
  customSiteTitle: "Lendsqr Wallet API Documentation",
  customfavIcon: "https://lendsqr.com/favicon.ico",
};

/**
 * Swagger UI setup middleware
 * 
 * Returns the configured Swagger UI middleware for Express.
 * Use this in your Express app to serve the interactive API documentation.
 * 
 * @example
 * ```typescript
 * import { swaggerUiSetup, swaggerUiServe } from './docs';
 * 
 * app.use('/api-docs', swaggerUiServe, swaggerUiSetup);
 * ```
 */
export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, swaggerUiOptions);

/**
 * Export the OpenAPI spec as JSON for programmatic access
 * 
 * This can be used to serve the raw OpenAPI specification
 * or for integration with other tools.
 * 
 * @example
 * ```typescript
 * import { swaggerSpec } from './docs';
 * 
 * app.get('/api-docs.json', (req, res) => {
 *   res.json(swaggerSpec);
 * });
 * ```
 */
export { swaggerSpec as openApiSpec };

