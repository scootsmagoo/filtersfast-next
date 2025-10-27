import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

// Security: Ensure required environment variables are set
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is required');
}

// Security: Use environment variable for database path
const dbPath = process.env.DATABASE_URL || "./auth.db";

export const auth = betterAuth({
  database: new Database(dbPath),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Security: Enforce server-side password requirements
    passwordValidation: (password: string) => {
      if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
      }
      if (password.length > 128) {
        return { valid: false, error: 'Password is too long' };
      }
      // Require at least one uppercase, one lowercase, and one number
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
        return { valid: false, error: 'Password must contain uppercase, lowercase, and number' };
      }
      return { valid: true };
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (updates session if it's older than this)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  
  // Security: Advanced session and cookie configuration
  advanced: {
    cookiePrefix: "filtersfast",
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    generateId: () => {
      // Use crypto for secure random IDs
      return crypto.randomUUID();
    },
  },
  
  // Security: Rate limiting configuration
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 5, // Max 5 requests per window
    // Storage will use in-memory by default, use Redis in production
  },
  
  // Security: Trust proxy for correct IP detection behind load balancers
  trustedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.BETTER_AUTH_URL!]
    : ["http://localhost:3000"],
  
  socialProviders: {
    // We'll add Google, Facebook etc. in Phase 3
  },
  
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
    // Security: Sanitize user inputs
    modelOptions: {
      sanitizeUserData: true,
    },
  },
});

