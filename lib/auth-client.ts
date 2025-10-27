'use client';

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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

