import { ReownAuthentication } from '@reown/appkit-siwx'

// SIWX Configuration using Reown Authentication
export const siwxConfig = new ReownAuthentication({
  // Authentication is NOT required - user must manually trigger sign in
  // This prevents auto-popup of sign modal on wallet connect
  required: false,

  // Custom storage keys (optional, using defaults)
  localAuthStorageKey: '@appkit/siwx-auth-token',
  localNonceStorageKey: '@appkit/siwx-nonce-token',
})

// With required: false, wallet stays connected even if user denies signing
// Sign in will be triggered manually in login/signup flows
// onSignIn callback will be handled later when we integrate Supabase
