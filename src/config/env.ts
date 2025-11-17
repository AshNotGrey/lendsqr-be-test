/**
 * Centralized Environment Configuration Module
 * 
 * This module validates and exports all environment variables required by the application.
 * It ensures that all required configuration is present and correctly formatted before
 * the application starts, preventing runtime errors due to missing configuration.
 * 
 * @module config/env
 */

import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Valid values for NODE_ENV
 */
type NodeEnv = "development" | "production" | "test";

/**
 * Valid values for ADJUTOR_MODE
 */
type AdjutorMode = "live" | "mock";

/**
 * Application configuration interface
 * All configuration values are validated and typed
 */
interface Config {
  /** Node environment: development, production, or test */
  nodeEnv: NodeEnv;
  
  /** HTTP port the server listens on */
  port: number;
  
  /** MySQL database connection string */
  databaseUrl: string;
  
  /** HMAC secret key for signing authentication tokens */
  hmacSecret: string;
  
  /** Adjutor API configuration */
  adjutor: {
    /** Base URL for Adjutor API */
    baseUrl: string;
    
    /** API key for authentication */
    apiKey: string;
    
    /** Operating mode: live or mock */
    mode: AdjutorMode;
    
    /** Request timeout in milliseconds */
    timeout: number;
  };
  
  /** Logging configuration */
  logLevel: string;
}

/**
 * Retrieves an environment variable and throws an error if it's not set
 * 
 * @param key - The environment variable name
 * @param defaultValue - Optional default value if variable is not set
 * @returns The environment variable value
 * @throws Error if the variable is not set and no default is provided
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(
      `Environment variable ${key} is required but not set. ` +
      `Please check your .env file or environment configuration.`
    );
  }
  
  return value;
}

/**
 * Validates and converts a string to a number
 * 
 * @param key - The environment variable name (for error messages)
 * @param value - The string value to convert
 * @param min - Optional minimum value
 * @param max - Optional maximum value
 * @returns The parsed number
 * @throws Error if the value is not a valid number or out of range
 */
function parseNumber(
  key: string,
  value: string,
  min?: number,
  max?: number
): number {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    throw new Error(
      `Environment variable ${key} must be a valid number. Got: ${value}`
    );
  }
  
  if (min !== undefined && num < min) {
    throw new Error(
      `Environment variable ${key} must be at least ${min}. Got: ${num}`
    );
  }
  
  if (max !== undefined && num > max) {
    throw new Error(
      `Environment variable ${key} must be at most ${max}. Got: ${num}`
    );
  }
  
  return num;
}

/**
 * Validates NODE_ENV value
 * 
 * @param value - The NODE_ENV value to validate
 * @returns The validated NodeEnv value
 * @throws Error if the value is not valid
 */
function validateNodeEnv(value: string): NodeEnv {
  const validEnvs: NodeEnv[] = ["development", "production", "test"];
  
  if (!validEnvs.includes(value as NodeEnv)) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvs.join(", ")}. Got: ${value}`
    );
  }
  
  return value as NodeEnv;
}

/**
 * Validates ADJUTOR_MODE value
 * 
 * @param value - The ADJUTOR_MODE value to validate
 * @returns The validated AdjutorMode value
 * @throws Error if the value is not valid
 */
function validateAdjutorMode(value: string): AdjutorMode {
  const validModes: AdjutorMode[] = ["live", "mock"];
  
  if (!validModes.includes(value as AdjutorMode)) {
    throw new Error(
      `ADJUTOR_MODE must be one of: ${validModes.join(", ")}. Got: ${value}`
    );
  }
  
  return value as AdjutorMode;
}

/**
 * Validates database URL format
 * 
 * @param url - The database URL to validate
 * @returns The validated URL
 * @throws Error if the URL format is invalid
 */
function validateDatabaseUrl(url: string): string {
  // Basic validation for MySQL connection string format
  if (!url.startsWith("mysql://") && !url.startsWith("mysql2://")) {
    throw new Error(
      `DATABASE_URL must start with mysql:// or mysql2://. Got: ${url.substring(0, 20)}...`
    );
  }
  
  return url;
}

/**
 * Validates and loads all environment configuration
 * This function is called immediately when the module is imported
 * 
 * @returns Complete validated configuration object
 * @throws Error if any required configuration is missing or invalid
 */
function loadConfig(): Config {
  try {
    // Load and validate all environment variables
    const nodeEnv = validateNodeEnv(getEnvVar("NODE_ENV", "development"));
    const port = parseNumber("PORT", getEnvVar("PORT", "3000"), 1, 65535);
    const databaseUrl = validateDatabaseUrl(getEnvVar("DATABASE_URL"));
    const hmacSecret = getEnvVar("HMAC_SECRET");
    
    // Validate HMAC secret length for security
    if (hmacSecret.length < 32) {
      throw new Error(
        "HMAC_SECRET must be at least 32 characters long for security. " +
        `Current length: ${hmacSecret.length}`
      );
    }
    
    // Load Adjutor configuration
    const adjutorBaseUrl = getEnvVar("ADJUTOR_BASE_URL", "https://adjutor.lendsqr.com");
    const adjutorApiKey = getEnvVar("ADJUTOR_API_KEY");
    const adjutorMode = validateAdjutorMode(getEnvVar("ADJUTOR_MODE", "mock"));
    const adjutorTimeout = parseNumber(
      "ADJUTOR_TIMEOUT",
      getEnvVar("ADJUTOR_TIMEOUT", "5000"),
      1000,
      30000
    );
    
    // Warn if using mock mode in production
    if (nodeEnv === "production" && adjutorMode === "mock") {
      console.warn(
        "⚠️  WARNING: ADJUTOR_MODE is set to 'mock' in production environment. " +
        "This should only be used for testing!"
      );
    }
    
    const logLevel = getEnvVar("LOG_LEVEL", "info");
    
    return {
      nodeEnv,
      port,
      databaseUrl,
      hmacSecret,
      adjutor: {
        baseUrl: adjutorBaseUrl,
        apiKey: adjutorApiKey,
        mode: adjutorMode,
        timeout: adjutorTimeout,
      },
      logLevel,
    };
  } catch (error) {
    // Enhance error message with helpful context
    console.error("❌ Configuration Error:");
    console.error((error as Error).message);
    console.error("\nPlease ensure all required environment variables are set.");
    console.error("See env.example for the complete list of required variables.\n");
    
    // Exit process in production, throw in test/development
    if (process.env['NODE_ENV'] === "production") {
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and typed configuration object
 * Import this in other modules to access configuration values
 * 
 * @example
 * ```typescript
 * import { config } from '@config/env';
 * 
 * const port = config.port;
 * const apiKey = config.adjutor.apiKey;
 * ```
 */
export const config: Config = loadConfig();

/**
 * Check if the application is running in production mode
 * 
 * @returns true if NODE_ENV is production
 */
export const isProduction = (): boolean => config.nodeEnv === "production";

/**
 * Check if the application is running in development mode
 * 
 * @returns true if NODE_ENV is development
 */
export const isDevelopment = (): boolean => config.nodeEnv === "development";

/**
 * Check if the application is running in test mode
 * 
 * @returns true if NODE_ENV is test
 */
export const isTest = (): boolean => config.nodeEnv === "test";

// Log successful configuration load in development
if (isDevelopment()) {
  console.log("✅ Configuration loaded successfully");
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Adjutor Mode: ${config.adjutor.mode}`);
}

