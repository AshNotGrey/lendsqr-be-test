/**
 * Adjutor Controller
 * 
 * Handles Adjutor Karma check HTTP requests (for testing/debugging).
 * 
 * @module controllers/adjutor.controller
 */

import { Request, Response, NextFunction } from "express";
import { AdjutorService, IdentityType } from "../services/adjutor.service";

/**
 * Adjutor controller class
 */
export class AdjutorController {
  /**
   * Check Karma blacklist
   * 
   * GET /api/v1/adjutor/karma/:identityType/:identity
   * 
   * Path parameters:
   * - identityType: 'bvn' | 'email' | 'phone'
   * - identity: the identity value to check
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async checkKarma(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { identityType, identity } = req.params;

      if (!identity || !identityType) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: "Identity and identityType are required",
        });
        return;
      }

      // Check Karma
      const result = await AdjutorService.checkKarma(
        identity,
        identityType as IdentityType
      );

      // Return success response
      res.status(200).json({
        success: true,
        message: result.isFlagged 
          ? "Identity is blacklisted" 
          : "Identity is clean",
        data: {
          is_flagged: result.isFlagged,
          identity_type: result.identityType,
          checked_at: result.checkedAt,
          raw_response: result.rawResponse,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

