/**
 * User Service
 * 
 * Handles user-related business logic.
 * 
 * @module services/user.service
 */

import { knex } from "../db";

/**
 * User data interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "blocked" | "blacklisted";
  created_at: Date;
  updated_at: Date;
}

/**
 * User service class
 */
export class UserService {
  /**
   * Get user by ID
   * 
   * @param userId - User UUID
   * @returns User data
   * @throws Error if user not found
   */
  static async getUserById(userId: string): Promise<User> {
    const user = await knex("users")
      .where({ id: userId })
      .first();

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return user;
  }

  /**
   * Get user by email
   * 
   * @param email - User email
   * @returns User data or null
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const user = await knex("users")
      .where({ email })
      .first();

    return user || null;
  }

  /**
   * Get user by phone
   * 
   * @param phone - User phone
   * @returns User data or null
   */
  static async getUserByPhone(phone: string): Promise<User | null> {
    const user = await knex("users")
      .where({ phone })
      .first();

    return user || null;
  }

  /**
   * Check if email already exists
   * 
   * @param email - Email to check
   * @returns true if exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Check if phone already exists
   * 
   * @param phone - Phone to check
   * @returns true if exists
   */
  static async phoneExists(phone: string): Promise<boolean> {
    const user = await this.getUserByPhone(phone);
    return user !== null;
  }
}

