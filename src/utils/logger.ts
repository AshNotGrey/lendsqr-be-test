/**
 * Logger Utility
 * 
 * Simple logging utility for consistent log formatting across the application.
 * In production, this can be replaced with a more sophisticated logging library.
 * 
 * @module utils/logger
 */

import { config } from "../config/env";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Log level priority (for filtering)
 */
const levelPriority: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Get current log level from config
 */
const currentLevelPriority = levelPriority[config.logLevel as LogLevel] ?? 1;

/**
 * Format log message with timestamp and level
 * 
 * @param level - Log level
 * @param message - Log message
 * @param meta - Optional metadata
 * @returns Formatted log string
 */
function formatLog(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

/**
 * Check if log level should be output
 * 
 * @param level - Log level to check
 * @returns true if level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= currentLevelPriority;
}

/**
 * Logger interface
 */
export const logger = {
  /**
   * Log debug message (development only)
   * 
   * @param message - Debug message
   * @param meta - Optional metadata
   */
  debug(message: string, meta?: any): void {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(formatLog(LogLevel.DEBUG, message, meta));
    }
  },

  /**
   * Log info message
   * 
   * @param message - Info message
   * @param meta - Optional metadata
   */
  info(message: string, meta?: any): void {
    if (shouldLog(LogLevel.INFO)) {
      console.log(formatLog(LogLevel.INFO, message, meta));
    }
  },

  /**
   * Log warning message
   * 
   * @param message - Warning message
   * @param meta - Optional metadata
   */
  warn(message: string, meta?: any): void {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatLog(LogLevel.WARN, message, meta));
    }
  },

  /**
   * Log error message
   * 
   * @param message - Error message
   * @param error - Optional error object
   * @param meta - Optional metadata
   */
  error(message: string, error?: Error | any, meta?: any): void {
    if (shouldLog(LogLevel.ERROR)) {
      const errorMeta = error instanceof Error
        ? { error: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
      console.error(formatLog(LogLevel.ERROR, message, errorMeta));
    }
  },
};

