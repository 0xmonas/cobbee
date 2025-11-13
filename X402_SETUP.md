# x402 Payment Protocol Integration

This document explains how Cobbee integrates with the x402 payment protocol for P2P USDC payments on Base network.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Testing on Base Sepolia](#testing-on-base-sepolia)
- [Production Deployment](#production-deployment)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Cobbee uses the **x402 payment protocol** to enable instant, peer-to-peer USDC payments directly from supporters to creators on Base network.

### Key Features

✅ **P2P Payments** - Direct supporter → creator transfers (no intermediaries, no commission)
✅ **Dynamic Pricing** - Each creator sets their own coffee price (0.10-1.00 USDC)
✅ **Variable Quantity** - Supporters can buy 1-100 coffees
✅ **Network Switching** - Easy testnet/mainnet toggle via environment variables
✅ **Low Fees** - Base network fees (typically < $0.01)
✅ **Automatic Payment Flow** - x402-fetch handles 402 responses automatically

---

## 🏗️ Architecture

### Payment Flow

```
┌─────────────┐                           ┌──────────────┐
│  Supporter  │                           │   Creator    │
│   (Buyer)   │                           │   (Seller)   │
└──────┬──────┘                           └──────┬───────┘
       │                                         │
       │ 1. Request (no payment)                 │
       │────────────────────────────────────────>│
       │                                         │
       │ 2. 402 Payment Required                 │
       │<────────────────────────────────────────│
       │   (amount, recipient, network)          │
       │                                         │
       │ 3. Execute Payment (USDC)              │
       │────────────────────────────────────────>│
       │   via Reown Wallet + x402-fetch         │
       │                                         │
       │ 4. Retry with x-payment proof          │
       │────────────────────────────────────────>│
       │                                         │
       │ 5. Verify via Facilitator              │
       │          ┌──────────────────────────┐   │
       │          │ Coinbase x402 Facilitator│   │
       │          └──────────────────────────┘   │
       │                                         │
       │ 6. Create support record + Success     │
       │<────────────────────────────────────────│
       │   (transaction hash, support details)   │
       │                                         │
```

### Components

1. **Backend API** ([/app/api/support/buy/route.ts](app/api/support/buy/route.ts))
   - Returns 402 Payment Required with dynamic pricing
   - Verifies payments via Facilitator
   - Creates support records in Supabase

2. **Frontend Client** ([/components/coffee-support.tsx](components/coffee-support.tsx))
   - Integrates x402-fetch with Reown AppKit wallet
   - Automatically handles payment flow
   - Displays transaction status

3. **Configuration** ([/lib/x402-config.ts](lib/x402-config.ts))
   - Network switching (testnet/mainnet)
   - Chain configurations
   - USDC contract addresses

4. **Wallet Integration** ([/lib/x402-client.ts](lib/x402-client.ts))
   - Connects x402-fetch with Reown AppKit
   - Creates viem wallet clients

---

## 🚀 Setup Instructions

### 1. Install Dependencies

Dependencies are already installed via pnpm:

```bash
pnpm install
```

**Installed packages:**
- `x402-fetch@0.7.0` - x402 client library
- `viem@2.x` - Ethereum library for wallet operations

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Add the following x402 configuration to `.env.local`:

```bash
# x402 Payment Protocol Configuration
NEXT_PUBLIC_X402_NETWORK=base-sepolia  # Use "base" for mainnet

# Facilitator URL (Coinbase-hosted)
NEXT_PUBLIC_X402_FACILITATOR_URL=https://facilitator.x402.coinbase.com

# Base Sepolia Testnet
NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID=84532
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Base Mainnet (for production)
# NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID=8453
# NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# USDC Contract Addresses
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 3. Verify Configuration

Check that all files are in place:

```
✅ app/api/support/buy/route.ts        - Backend 402 endpoint
✅ lib/x402-config.ts                  - Network configuration
✅ lib/x402-client.ts                  - Wallet integration
✅ components/coffee-support.tsx       - Frontend integration
✅ .env.local                          - Environment variables
```

---

## 🧪 Testing on Base Sepolia

### Prerequisites

1. **MetaMask or WalletConnect-compatible wallet**
2. **Base Sepolia ETH** (for gas fees)
   - Get from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
3. **Base Sepolia USDC** (for payments)
   - Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Add to wallet manually or use Base Sepolia faucet

### Testing Steps

1. **Start development server:**
   ```bash
   pnpm dev
   ```

2. **Set testnet mode in `.env.local`:**
   ```bash
   NEXT_PUBLIC_X402_NETWORK=base-sepolia
   ```

3. **Test the payment flow:**
   - Visit a creator profile (e.g., http://localhost:3000/alice)
   - Click "Buy a coffee"
   - Enter details and connect wallet
   - Approve the USDC transaction
   - Verify payment success

4. **Check transaction on explorer:**
   - Base Sepolia: https://sepolia.basescan.org/

### Expected Behavior

- ✅ Wallet connects via Reown AppKit
- ✅ Coffee price dynamically calculated (creator's price × quantity)
- ✅ USDC approval requested (if first time)
- ✅ USDC transfer executed to creator's wallet
- ✅ Transaction hash displayed
- ✅ Support record created in database
- ✅ Notification sent to creator

---

## 🚀 Production Deployment

### 1. Switch to Mainnet

Update `.env.local` (or Vercel environment variables):

```bash
# Change network to mainnet
NEXT_PUBLIC_X402_NETWORK=base

# Use mainnet RPC
NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID=8453
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Use mainnet USDC
NEXT_PUBLIC_USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### 2. Verify Creator Wallets

Ensure all creators have set their wallet addresses in settings:
```sql
SELECT username, wallet_address
FROM users
WHERE wallet_address IS NOT NULL;
```

### 3. Deploy to Vercel

```bash
# Build locally to test
pnpm build

# Deploy to Vercel
vercel --prod
```

### 4. Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:
- Add all `NEXT_PUBLIC_X402_*` variables
- Set `NEXT_PUBLIC_X402_NETWORK=base` for production
- Save and redeploy

### 5. Test on Mainnet

⚠️ **Use small amounts for initial tests!**

- Test with 0.10 USDC first
- Verify transaction appears on BaseScan
- Check database support record created
- Confirm creator receives notification

---

## 🔄 How It Works

### Step-by-Step Flow

#### 1. **Initial Request (No Payment)**

Supporter clicks "Purchase" → Frontend sends request to `/api/support/buy`:

```typescript
POST /api/support/buy
{
  "creator_id": "...",
  "supporter_name": "Alice",
  "coffee_count": 5,
  "message": "Great work!"
}
```

#### 2. **Backend Returns 402**

Server calculates price and responds with 402 in x402 protocol format:

```typescript
HTTP 402 Payment Required
{
  "x402Version": 1,
  "error": "payment-required",
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "5000000",  // 5 USDC (6 decimals)
    "resource": "http://localhost:3000/api/support/buy",
    "description": "Buy 5 coffees for Alice",
    "mimeType": "application/json",
    "payTo": "0xCreatorWalletAddress",
    "maxTimeoutSeconds": 300,
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"  // USDC token address
  }]
}
```

**Key fields:**
- `x402Version`: Protocol version (currently 1)
- `error`: Error reason enum value (e.g., "payment-required")
- `accepts`: Array of payment requirements
  - `scheme`: Payment scheme ("exact" for fixed amount)
  - `network`: Network name (e.g., "base-sepolia", "base")
  - `maxAmountRequired`: Maximum amount in smallest units (wei/satoshi equivalent)
  - `resource`: URL of the resource being purchased
  - `description`: Human-readable description
  - `mimeType`: Response content type
  - `payTo`: Recipient wallet address
  - `maxTimeoutSeconds`: Payment validity timeout
  - `asset`: Token contract address (USDC)

#### 3. **x402-fetch Handles Payment**

x402-fetch automatically:
- Parses 402 response
- Requests USDC approval (if needed)
- Executes USDC transfer
- Creates payment proof

#### 4. **Retry with Proof**

x402-fetch retries request with `x-payment` header:

```typescript
POST /api/support/buy
Headers: {
  "x-payment": "{transactionHash, from, to, amount, ...}"
}
```

#### 5. **Backend Verifies via Facilitator**

Server sends payment proof to Coinbase Facilitator:

```typescript
POST https://facilitator.x402.coinbase.com/verify
{
  "payment": {...},
  "expectedAmount": "5000000",
  "expectedRecipient": "0xCreator...",
  "expectedToken": "0x036Cb...",
  "expectedNetwork": "base-sepolia"
}
```

#### 6. **Create Support & Return Success**

If verified:
- Insert support record in database
- Trigger notification to creator
- Return success with transaction hash

```typescript
HTTP 200 OK
{
  "success": true,
  "support": {...},
  "payment": {
    "transactionHash": "0xabc123...",
    "amount": 5.0,
    "network": "base-sepolia"
  }
}
```

---

## 🐛 Troubleshooting

### Payment Fails / 402 Error

**Problem:** Payment not going through

**Solutions:**
1. Check wallet has sufficient USDC balance
2. Check wallet has ETH for gas fees (even on Base, need some ETH)
3. Verify network is correct (Base Sepolia vs Base Mainnet)
4. Check creator has wallet_address set in database

### "Creator has not set up their wallet yet"

**Problem:** Creator's wallet_address is NULL

**Solution:**
```sql
-- Update creator's wallet
UPDATE users
SET wallet_address = '0xYourWalletAddress'
WHERE username = 'alice';
```

### Transaction Hash Not Showing

**Problem:** Success screen shows but no transaction hash

**Solutions:**
1. Check console for errors
2. Verify facilitator response includes `transactionHash`
3. Check network connectivity

### Wrong Network / USDC Contract

**Problem:** "Token not found" or "Invalid network"

**Solutions:**
1. Verify `.env.local` has correct network config:
   ```bash
   NEXT_PUBLIC_X402_NETWORK=base-sepolia  # or "base"
   ```
2. Check USDC contract address matches network:
   - Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Facilitator Returns 402 / Verification Failed

**Problem:** Payment executed but verification fails

**Solutions:**
1. Check facilitator URL is correct:
   ```bash
   NEXT_PUBLIC_X402_FACILITATOR_URL=https://facilitator.x402.coinbase.com
   ```
2. Verify transaction was actually sent on-chain
3. Check amount matches exactly (6 decimals for USDC)
4. Ensure recipient address matches creator's wallet

### TypeScript Errors

**Problem:** `window.ethereum` type errors

**Solution:** Already handled in `lib/x402-client.ts` with proper checks:
```typescript
if (typeof window === 'undefined' || !window.ethereum) {
  console.error('window.ethereum not available')
  return null
}
```

### Build Errors

**Problem:** Next.js build fails with x402 imports

**Solutions:**
1. Ensure all x402 functions are only used in client components:
   ```typescript
   "use client"  // At top of file
   ```
2. Check viem version compatibility:
   ```bash
   pnpm list viem  # Should be 2.x
   ```

---

## 📚 Additional Resources

- **x402 Protocol Docs:** [/x402md/x402coinbase.md](x402md/x402coinbase.md)
- **x402 Buyer Guide:** [/x402md/x402gitbook.md](x402md/x402gitbook.md)
- **Base Network Docs:** https://docs.base.org
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **USDC Contract:** https://www.circle.com/en/usdc

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Environment variables configured correctly
- [ ] Network set to `base` (not `base-sepolia`)
- [ ] All creators have `wallet_address` set
- [ ] Tested small payment on mainnet (0.10 USDC)
- [ ] Transaction appears on BaseScan
- [ ] Support record created in database
- [ ] Creator receives notification
- [ ] Transaction hash displays correctly
- [ ] Explorer link works (basescan.org)

---

## 🎉 Success!

Your x402 payment integration is now complete! Supporters can now send USDC directly to creators using the x402 protocol.

**Key Benefits:**
- ✅ No intermediaries (P2P payments)
- ✅ No commission fees
- ✅ Low network fees (< $0.01 on Base)
- ✅ Instant settlements
- ✅ Full transparency (on-chain transactions)

For questions or issues, refer to the [x402 documentation](x402md/) or check the [troubleshooting section](#troubleshooting).
