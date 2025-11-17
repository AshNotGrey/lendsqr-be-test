/**
 * Authentication Service
 * 
 * Handles authentication business logic (user creation, token generation).
 * 
 * @module services/auth.service
 */

import { withTransaction, newId } from "../db";
import { generateToken } from "../utils/token";
import { UserService, User } from "./user.service";
import { WalletService } from "./wallet.service";
import { AdjutorService } from "./adjutor.service";
import { logger } from "../utils/logger";

/**
 * User registration data
 */
export interface SignupData {
  name: string;
  email: string;
  phone: string;
  bvn: string; // Not stored, only used for Adjutor check
}

/**
 * Login credentials
 */
export interface LoginData {
  email?: string;
  phone?: string;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Authentication service class
 */
export class AuthService {
  /**
   * Create a new user with wallet after Adjutor blacklist check
   * 
   * This is the main signup flow:
   * 1. Check if email/phone already exists
   * 2. Verify BVN against Adjutor Karma blacklist
   * 3. Create user and wallet in a transaction
   * 4. Log Adjutor check result
   * 5. Generate authentication token
   * 
   * @param userData - User registration data
   * @returns Created user and auth token
   * @throws Error if validation fails or user is blacklisted
   * 
   * @example
   * ```typescript
   * const result = await AuthService.createUser({
   *   name: "John Doe",
   *   email: "[email protected]",
   *   phone: "+2347012345678",
   *   bvn: "22212345678"
   * });
   * console.log(result.token);
   * ```
   */
  static async createUser(userData: SignupData): Promise<AuthResponse> {
    const { name, email, phone, bvn } = userData;

    // Check if email already exists
    if (await UserService.emailExists(email)) {
      throw new Error("Email already registered");
    }

    // Check if phone already exists
    if (await UserService.phoneExists(phone)) {
      throw new Error("Phone number already registered");
    }

    // Check Adjutor Karma blacklist
    logger.info(`Checking Adjutor blacklist for signup: ${email}`);
    const karmaResult = await AdjutorService.checkKarma(bvn, "bvn");

    if (karmaResult.isFlagged) {
      logger.warn(`User blocked due to blacklist: ${email}`);
      throw new Error(
        "User is blacklisted and cannot be onboarded. " +
        "Please contact support for assistance."
      );
    }

    // Create user and wallet in transaction
    const { user, wallet } = await withTransaction(async (trx) => {
      // Create user
      const userId = newId();
      const [createdUser] = await trx("users")
        .insert({
          id: userId,
          name,
          email,
          phone,
          status: "active",
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning("*");

      // Create wallet for user
      const createdWallet = await WalletService.createWallet(userId, trx);

      logger.info(`User created successfully: ${userId}`);

      return {
        user: createdUser,
        wallet: createdWallet,
      };
    });

    // Log Adjutor check (outside main transaction)
    try {
      await AdjutorService.logCheck(
        user.id,
        "bvn",
        karmaResult.rawResponse,
        karmaResult.isFlagged
      );
    } catch (error) {
      // Log error but don't fail signup
      logger.error("Failed to log Adjutor check", error);
    }

    // Generate auth token
    const token = generateToken(user.id);

    logger.info(`Signup complete for user: ${user.id}`);

    return {
      user,
      token,
    };
  }

  /**
   * Authenticate user and generate token
   * 
   * Login using either email or phone number.
   * Validates that the user is not blocked or blacklisted.
   * 
   * @param credentials - Login credentials (email or phone)
   * @returns User and auth token
   * @throws Error if user not found or account is blocked
   * 
   * @example
   * ```typescript
   * const result = await AuthService.loginUser({
   *   email: "[email protected]"
   * });
   * ```
   */
  static async loginUser(credentials: LoginData): Promise<AuthResponse> {
    const { email, phone } = credentials;

    // Must provide either email or phone
    if (!email && !phone) {
      throw new Error("Email or phone number is required");
    }

    // Find user
    let user: User | null = null;

    if (email) {
      user = await UserService.getUserByEmail(email);
    } else if (phone) {
      user = await UserService.getUserByPhone(phone);
    }

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check user status
    if (user.status === "blocked") {
      throw new Error("Account is blocked. Please contact support.");
    }

    if (user.status === "blacklisted") {
      throw new Error("Account is blacklisted and cannot access services.");
    }

    // Generate auth token
    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.id}`);

    return {
      user,
      token,
    };
  }
}

