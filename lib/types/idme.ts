/**
 * ID.me Verification Types
 * 
 * Types for military, first responder, and employee verification
 */

export type VerificationType = 'military' | 'responder' | 'employee' | 'student' | 'teacher' | 'nurse';

export type VerificationStatus = 'active' | 'expired' | 'revoked';

export interface IdMeVerification {
  id: number;
  userId: string;
  verificationType: VerificationType;
  idmeUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  verifiedAt: string;
  expiresAt?: string;
  status: VerificationStatus;
  metadata?: string; // JSON string for additional data
  createdAt: string;
  updatedAt: string;
}

export interface IdMeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface IdMeUserInfo {
  sub: string; // ID.me user ID
  email: string;
  fname?: string;
  lname?: string;
  verified: boolean;
  group?: string[]; // e.g., ["military", "responder"]
}

export interface IdMeVerificationRequest {
  code: string;
  state?: string;
}

export interface IdMeDiscount {
  id: number;
  verificationType: VerificationType;
  discountPercentage: number;
  discountCode: string;
  isActive: boolean;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCheckResult {
  isVerified: boolean;
  verificationType?: VerificationType;
  discountPercentage?: number;
  expiresAt?: string;
}

