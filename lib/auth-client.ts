'use client';

import { createAuthClient } from "better-auth/react";

// Dynamically determine the base URL to support any port during development
const getBaseURL = () => {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In browser, use current origin (supports any port)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for SSR (use port 3001 which is the current dev port)
  return "http://localhost:3001";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Social sign-in helpers
export const signInWithGoogle = async () => {
  return await signIn.social({
    provider: 'google',
    callbackURL: '/account',
  });
};

export const signInWithFacebook = async () => {
  return await signIn.social({
    provider: 'facebook',
    callbackURL: '/account',
  });
};

export const signInWithApple = async () => {
  return await signIn.social({
    provider: 'apple',
    callbackURL: '/account',
  });
};

