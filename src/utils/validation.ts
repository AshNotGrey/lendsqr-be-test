/**
 * Validation Schemas
 * 
 * Zod schemas for request validation across all endpoints.
 * 
 * @module utils/validation
 */

import { z } from "zod";

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * BVN validation schema (11 digits)
 */
const bvnSchema = z
  .string()
  .length(11, "BVN must be exactly 11 digits")
  .regex(/^\d{11}$/, "BVN must contain only numbers");

/**
 * Email validation schema
 */
const emailSchema = z.string().email("Invalid email format");

/**
 * Phone validation schema (international format)
 */
const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 characters")
  .max(20, "Phone number must be at most 20 characters")
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format");

/**
 * Amount validation schema (positive decimal)
 */
const amountSchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be a finite number");

/**
 * Reference validation schema
 */
const referenceSchema = z
  .string()
  .min(1, "Reference is required")
  .max(80, "Reference must be at most 80 characters");

// ==================== Auth Schemas ====================

/**
 * Signup request schema
 */
export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: emailSchema,
    phone: phoneSchema,
    bvn: bvnSchema,
  }),
});

/**
 * Login request schema
 */
export const loginSchema = z.object({
  body: z
    .object({
      email: emailSchema.optional(),
      phone: phoneSchema.optional(),
    })
    .refine((data) => data.email || data.phone, {
      message: "Either email or phone is required",
    }),
});

// ==================== User Schemas ====================

/**
 * Get user by ID schema
 */
export const getUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// ==================== Wallet Schemas ====================

/**
 * Fund wallet schema
 * Reference is auto-generated, so not required in request
 */
export const fundWalletSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  body: z.object({
    amount: amountSchema,
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Withdraw from wallet schema
 * Reference is auto-generated, so not required in request
 */
export const withdrawWalletSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  body: z.object({
    amount: amountSchema,
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Transfer between wallets schema
 * Reference is auto-generated, so not required in request
 */
export const transferSchema = z.object({
  body: z.object({
    fromUserId: uuidSchema,
    toUserId: uuidSchema,
    amount: amountSchema,
    metadata: z.record(z.any()).optional(),
  }).refine((data) => data.fromUserId !== data.toUserId, {
    message: "Cannot transfer to yourself",
  }),
});

/**
 * Get wallet balance schema
 */
export const getBalanceSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
});

// ==================== Adjutor Schemas ====================

/**
 * Check Karma schema
 */
export const checkKarmaSchema = z.object({
  params: z.object({
    identityType: z.enum(["bvn", "email", "phone"]),
    identity: z.string().min(1, "Identity is required"),
  }),
});

