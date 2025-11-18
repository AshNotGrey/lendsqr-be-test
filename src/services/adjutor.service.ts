/**
 * Adjutor Service
 * 
 * Handles Adjutor Karma blacklist API integration with mock mode support.
 * 
 * API Documentation: https://docs.adjutor.io/adjutor-api-endpoints/validation/karma-lookup
 * 
 * @module services/adjutor.service
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { config } from "../config/env";
import { knex, newId } from "../db";
import { logger } from "../utils/logger";

/**
 * Identity types supported by Adjutor
 */
export type IdentityType = "bvn" | "email" | "phone";

/**
 * Adjutor API response structure
 */
interface AdjutorKarmaResponse {
  status: string;
  message: string;
  "mock-response"?: string; // Present when app is in test mode
  data?: {
    karma_identity: string;
    amount_in_contention: string;
    reason: string | null;
    default_date: string;
    karma_type: {
      karma: string;
    };
    karma_identity_type: {
      identity_type: string;
    };
    reporting_entity: {
      name: string;
      email: string;
    };
  };
  meta?: {
    cost: number;
    balance: number;
  };
}

/**
 * Karma check result
 */
export interface KarmaCheckResult {
  isFlagged: boolean;
  identity: string;
  identityType: IdentityType;
  rawResponse: AdjutorKarmaResponse;
  checkedAt: Date;
}

/**
 * Adjutor service class
 */
export class AdjutorService {
  private static axiosInstance: AxiosInstance | null = null;

  /**
   * Get or create Axios instance for Adjutor API
   * 
   * Configured with:
   * - Base URL from config
   * - Timeout
   * - Retry logic for rate limits and server errors
   * 
   * @returns Configured Axios instance
   */
  private static getAxiosInstance(): AxiosInstance {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: config.adjutor.baseUrl,
        timeout: config.adjutor.timeout,
        headers: {
          "Content-Type": "application/json",
          // API key authentication (header name from Adjutor docs)
          Authorization: `Bearer ${config.adjutor.apiKey}`,
        },
      });

      // Configure retry logic
      axiosRetry(this.axiosInstance, {
        retries: 2,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error: AxiosError) => {
          // Retry on rate limit (429) or server errors (5xx)
          return (
            error.response?.status === 429 ||
            (error.response?.status !== undefined && error.response.status >= 500)
          );
        },
        onRetry: (retryCount, error) => {
          logger.warn(`Adjutor API retry attempt ${retryCount}`, {
            status: error.response?.status,
            message: error.message,
          });
        },
      });
    }

    return this.axiosInstance;
  }

  /**
   * Generate mock response for testing
   * 
   * @param identity - Identity value
   * @param identityType - Identity type
   * @param isBlacklisted - Whether to simulate blacklist
   * @returns Mock Adjutor response
   */
  private static generateMockResponse(
    identity: string,
    identityType: IdentityType,
    isBlacklisted: boolean = false
  ): AdjutorKarmaResponse {
    if (isBlacklisted) {
      // Mock blacklisted response
      return {
        status: "success",
        message: "Successful",
        data: {
          karma_identity: identity,
          amount_in_contention: "50000.00",
          reason: "Default on loan repayment",
          default_date: new Date().toISOString().split("T")[0] as string,
          karma_type: {
            karma: "Loan Default",
          },
          karma_identity_type: {
            identity_type: identityType.toUpperCase(),
          },
          reporting_entity: {
            name: "Mock Lender",
            email: "[email protected]",
          },
        },
        meta: {
          cost: 10,
          balance: 9990,
        },
      };
    }

    // Mock clean response (no blacklist)
    return {
      status: "success",
      message: "No record found",
      meta: {
        cost: 10,
        balance: 9990,
      },
    };
  }

  /**
   * Check if an identity is blacklisted in Adjutor Karma
   * 
   * @param identity - The identity value (BVN, email, or phone)
   * @param identityType - Type of identity
   * @returns Karma check result
   * 
   * @example
   * ```typescript
   * const result = await AdjutorService.checkKarma("22212345678", "bvn");
   * if (result.isFlagged) {
   *   console.log("User is blacklisted!");
   * }
   * ```
   */
  static async checkKarma(
    identity: string,
    identityType: IdentityType
  ): Promise<KarmaCheckResult> {
    logger.info(`Checking Adjutor Karma for ${identityType}: ${identity.substring(0, 4)}***`);

    try {
      let response: AdjutorKarmaResponse;

      // Check if mock mode is enabled
      if (config.adjutor.mode === "mock") {
        logger.warn("⚠️  ADJUTOR_MODE is set to 'mock' - NOT making real API calls!");
        logger.debug("Using mock Adjutor response");
        
        // Simulate blacklist for specific test values
        const isTestBlacklisted = 
          identity === "12345678901" || // Test BVN
          identity === "[email protected]" || // Test email
          identity === "+2341234567890"; // Test phone
        
        response = this.generateMockResponse(identity, identityType, isTestBlacklisted);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // Live mode - call Adjutor API
        logger.info(`🌐 Making LIVE Adjutor API call for ${identityType}: ${identity.substring(0, 4)}***`);
        const axiosInstance = this.getAxiosInstance();
        
        // Adjutor API endpoint format: /v2/verification/karma/{identity}
        // The API auto-detects identity type from the format (BVN, email, phone, domain, etc.)
        // Reference: https://docs.adjutor.io/adjutor-api-endpoints/validation/karma-lookup
        const endpoint = `/v2/verification/karma/${encodeURIComponent(identity)}`;
        
        logger.debug(`Calling Adjutor API: ${config.adjutor.baseUrl}${endpoint}`);
        logger.debug(`Expected identity type: ${identityType}, API will auto-detect from format`);
        
        const apiResponse = await axiosInstance.get<AdjutorKarmaResponse>(endpoint);
        
        response = apiResponse.data;
        
        // Check if this is a test mode response
        if (response["mock-response"]) {
          logger.warn("⚠️  ADJUTOR APP IS IN TEST MODE - Returning mock/test data!");
          logger.warn(`   ${response["mock-response"]}`);
          logger.warn("   To get real blacklist data:");
          logger.warn("   1. Complete KYC: https://lsq.li/adjutor-kyc");
          logger.warn("   2. Toggle your app to 'Live Mode' in Adjutor dashboard");
        }
        
        // Log full response details for debugging
        const detectedType = response.data?.karma_identity_type?.identity_type || 'unknown';
        const isFlagged = !!(response.data && response.data.karma_identity);
        
        logger.info("✅ Received Adjutor API response", { 
          status: response.status,
          message: response.message,
          isTestMode: !!response["mock-response"],
          detectedIdentityType: detectedType,
          isFlagged: isFlagged,
          karmaIdentity: response.data?.karma_identity || null,
          cost: response.meta?.cost,
          balance: response.meta?.balance,
          fullResponse: config.nodeEnv === "development" ? response : undefined
        });
        
        // Warn if detected type doesn't match expected type
        if (response.data && detectedType.toLowerCase() !== identityType.toLowerCase()) {
          logger.warn(`⚠️  Identity type mismatch: Expected ${identityType}, but API detected ${detectedType}`);
          if (response["mock-response"]) {
            logger.warn("   This is likely due to test mode returning mock data");
          }
        }
      }

      // Determine if identity is flagged
      // According to Adjutor docs:
      // - If response.data exists with karma_identity, the identity is blacklisted
      // - If 404 is returned, no record exists (identity is clean)
      // Note: If your Adjutor app is in "test mode" on the platform, it may return
      // test data that flags all identities. Switch to "live/production" mode in
      // your Adjutor dashboard to get real blacklist data.
      const isFlagged = !!(response.data && response.data.karma_identity);

      const result: KarmaCheckResult = {
        isFlagged,
        identity,
        identityType,
        rawResponse: response,
        checkedAt: new Date(),
      };

      logger.info(`Karma check complete: ${isFlagged ? "FLAGGED" : "CLEAN"}`);
      return result;
    } catch (error) {
      // Handle Adjutor API errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // 404 means no blacklist record found (user is clean)
        if (axiosError.response?.status === 404) {
          logger.info("Karma check complete: CLEAN (404 - no record)");
          
          return {
            isFlagged: false,
            identity,
            identityType,
            rawResponse: {
              status: "success",
              message: "No record found",
            },
            checkedAt: new Date(),
          };
        }
        
        logger.error("Adjutor API error", axiosError, {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
        });
        
        // For other errors, fail open (allow user to proceed with warning)
        logger.warn("Adjutor check failed, allowing signup with warning");
        
        return {
          isFlagged: false,
          identity,
          identityType,
          rawResponse: {
            status: "error",
            message: "Adjutor check failed, proceeding with caution",
          },
          checkedAt: new Date(),
        };
      }

      // Unknown error
      logger.error("Unknown error during Karma check", error);
      throw error;
    }
  }

  /**
   * Log Adjutor check result to database
   * 
   * @param userId - User ID
   * @param identityType - Identity type checked
   * @param response - Adjutor API response
   * @param isFlagged - Whether user is blacklisted
   * @returns Log record ID
   */
  static async logCheck(
    userId: string,
    identityType: IdentityType,
    response: AdjutorKarmaResponse,
    isFlagged: boolean
  ): Promise<string> {
    try {
      const id = newId();

      await knex("adjutor_checks").insert({
        id,
        user_id: userId,
        identity_type: identityType,
        raw_response: JSON.stringify(response),
        is_flagged: isFlagged,
        checked_at: knex.fn.now(),
      });

      logger.debug(`Logged Adjutor check for user ${userId}`);
      return id;
    } catch (error) {
      logger.error("Failed to log Adjutor check", error);
      throw error;
    }
  }
}


