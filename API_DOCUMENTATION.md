# API Documentation

This document describes the API architecture for the Cobbee platform.

> **Note:** The backend API is currently **not implemented**. This document serves as a specification for future development.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Routes Structure](#api-routes-structure)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users/Creators](#userscreators-endpoints)
  - [Supports/Donations](#supportsdonations-endpoints)
  - [Payments](#payments-endpoints)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## Overview

### Current State: Mock Data

The application currently uses mock data from [lib/mock-data.ts](lib/mock-data.ts). All interactions are client-side only.

### Planned Architecture

When implementing the backend, we recommend:

- **Next.js Route Handlers** (App Router API routes)
- **RESTful API** design with JSON responses
- **Zod** for request/response validation
- **Server-side authentication** (NextAuth.js or Supabase)
- **Database ORM** (Prisma, Drizzle, or Supabase client)

## Architecture

### Tech Stack (Recommended)

```
┌─────────────────────────────────────────┐
│         Client (React/Next.js)          │
│  - Server Components (fetch API)        │
│  - Client Components (fetch/SWR)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     Next.js Route Handlers (API)        │
│  - app/api/*/route.ts                   │
│  - Zod validation                       │
│  - Error handling                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Business Logic Layer             │
│  - Services (use cases)                 │
│  - Validations                          │
│  - Authorization                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          Data Access Layer              │
│  - ORM (Prisma/Drizzle/Supabase)        │
│  - Database queries                     │
│  - Caching (Redis/Vercel KV)            │
└─────────────────────────────────────────┘
```

## API Routes Structure

### File Organization

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts          # POST /api/auth/login
│   │   ├── logout/
│   │   │   └── route.ts          # POST /api/auth/logout
│   │   ├── signup/
│   │   │   └── route.ts          # POST /api/auth/signup
│   │   ├── verify-otp/
│   │   │   └── route.ts          # POST /api/auth/verify-otp
│   │   └── session/
│   │       └── route.ts          # GET /api/auth/session
│   ├── users/
│   │   ├── [username]/
│   │   │   └── route.ts          # GET /api/users/:username
│   │   └── me/
│   │       ├── route.ts          # GET, PATCH /api/users/me
│   │       └── avatar/
│   │           └── route.ts      # POST /api/users/me/avatar
│   ├── supports/
│   │   ├── route.ts              # GET, POST /api/supports
│   │   ├── [id]/
│   │   │   └── route.ts          # GET /api/supports/:id
│   │   └── by-creator/
│   │       └── [username]/
│   │           └── route.ts      # GET /api/supports/by-creator/:username
│   ├── payments/
│   │   ├── create-intent/
│   │   │   └── route.ts          # POST /api/payments/create-intent
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts      # POST /api/payments/webhooks/stripe
│   │   └── history/
│   │       └── route.ts          # GET /api/payments/history
│   └── stats/
│       └── [username]/
│           └── route.ts          # GET /api/stats/:username
```

### Route Handler Template

```typescript
// app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Response schema
const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  bio: z.string(),
  avatar: z.string().url(),
  totalSupports: z.number(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // 1. Validate input
    const username = params.username

    // 2. Fetch data (from database)
    const user = await getUserByUsername(username)

    if (!user) {
      return NextResponse.json(
        { error: 'UserNotFound', message: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Validate output
    const validatedUser = userSchema.parse(user)

    // 4. Return response
    return NextResponse.json(validatedUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'InternalServerError', message: 'An error occurred' },
      { status: 500 }
    )
  }
}
```

## Authentication

### Recommended: NextAuth.js

```bash
pnpm add next-auth@beta
```

**Configuration:** `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials with database
        const user = await validateUser(credentials.email, credentials.password)
        return user || null
      },
    }),
  ],
  pages: {
    signIn: '/login',
    signOut: '/logout',
  },
})

export { handlers as GET, handlers as POST }
```

### Protected Routes

```typescript
// app/api/users/me/route.ts
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  const user = await getUserById(session.user.id)
  return NextResponse.json(user)
}
```

## Endpoints

### Authentication Endpoints

#### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "sarah@example.com",
  "password": "SecureP@ss123",
  "username": "sarahdesigns",
  "displayName": "Sarah Chen"
}
```

**Response (201):**
```json
{
  "id": "usr_123abc",
  "email": "sarah@example.com",
  "username": "sarahdesigns",
  "displayName": "Sarah Chen",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

**Errors:**
- `400` – ValidationError (invalid email, weak password, etc.)
- `409` – Conflict (username or email already exists)

---

#### POST /api/auth/login

Authenticate user and create session.

**Request:**
```json
{
  "email": "sarah@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "usr_123abc",
    "username": "sarahdesigns",
    "email": "sarah@example.com"
  },
  "sessionToken": "session_xyz789"
}
```

**Errors:**
- `401` – Unauthorized (invalid credentials)
- `429` – TooManyRequests (rate limited)

---

#### POST /api/auth/verify-otp

Verify OTP code for passwordless login or password reset.

**Request:**
```json
{
  "email": "sarah@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "verified": true,
  "resetToken": "reset_abc123"  // For password reset flow
}
```

**Errors:**
- `400` – ValidationError (invalid OTP format)
- `401` – Unauthorized (OTP expired or incorrect)

---

### Users/Creators Endpoints

#### GET /api/users/:username

Get public profile information for a creator.

**Response (200):**
```json
{
  "id": "usr_123abc",
  "username": "sarahdesigns",
  "displayName": "Sarah Chen",
  "bio": "UI/UX Designer creating beautiful interfaces...",
  "avatar": "https://cdn.example.com/avatars/sarah.jpg",
  "coverImage": "https://cdn.example.com/covers/sarah.jpg",
  "totalSupports": 342,
  "coffeePrice": 5,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Errors:**
- `404` – UserNotFound

---

#### GET /api/users/me

Get current authenticated user's profile (private data included).

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response (200):**
```json
{
  "id": "usr_123abc",
  "username": "sarahdesigns",
  "email": "sarah@example.com",
  "displayName": "Sarah Chen",
  "bio": "UI/UX Designer...",
  "avatar": "https://cdn.example.com/avatars/sarah.jpg",
  "coverImage": "https://cdn.example.com/covers/sarah.jpg",
  "coffeePrice": 5,
  "totalEarnings": 1710,
  "totalSupports": 342,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Errors:**
- `401` – Unauthorized (not logged in)

---

#### PATCH /api/users/me

Update current user's profile.

**Request:**
```json
{
  "displayName": "Sarah Chen (Updated)",
  "bio": "New bio text...",
  "coffeePrice": 7
}
```

**Response (200):**
```json
{
  "id": "usr_123abc",
  "username": "sarahdesigns",
  "displayName": "Sarah Chen (Updated)",
  "bio": "New bio text...",
  "coffeePrice": 7,
  "updatedAt": "2025-01-06T12:00:00Z"
}
```

**Errors:**
- `401` – Unauthorized
- `400` – ValidationError (invalid coffee price, bio too long, etc.)

---

#### POST /api/users/me/avatar

Upload new avatar image.

**Request (multipart/form-data):**
```
file: <image.jpg>
```

**Response (200):**
```json
{
  "avatar": "https://cdn.example.com/avatars/sarah_new.jpg",
  "updatedAt": "2025-01-06T12:30:00Z"
}
```

**Errors:**
- `401` – Unauthorized
- `400` – ValidationError (file too large, invalid format)
- `413` – PayloadTooLarge (> 5MB)

---

### Supports/Donations Endpoints

#### GET /api/supports/by-creator/:username

Get all supports for a specific creator (public).

**Query Parameters:**
- `limit` (number, default: 20) – Number of results
- `offset` (number, default: 0) – Pagination offset
- `sort` (string, default: 'recent') – Sort by: `recent`, `amount`

**Example:**
```
GET /api/supports/by-creator/sarahdesigns?limit=10&sort=amount
```

**Response (200):**
```json
{
  "supports": [
    {
      "id": "sup_abc123",
      "supporterName": "Alex Kim",
      "supporterAvatar": "https://cdn.example.com/avatars/alex.jpg",
      "coffeeCount": 5,
      "amount": 25,
      "message": "Your design tutorials are amazing!",
      "createdAt": "2025-01-06T10:00:00Z"
    },
    // ...
  ],
  "total": 342,
  "hasMore": true
}
```

**Errors:**
- `404` – UserNotFound

---

#### POST /api/supports

Create a new support/donation.

**Request:**
```json
{
  "creatorUsername": "sarahdesigns",
  "coffeeCount": 5,
  "message": "Love your work!",
  "supporterName": "Anonymous Supporter",
  "paymentIntentId": "pi_stripe123"  // From Stripe
}
```

**Response (201):**
```json
{
  "id": "sup_xyz789",
  "creatorId": "usr_123abc",
  "coffeeCount": 5,
  "amount": 25,
  "message": "Love your work!",
  "supporterName": "Anonymous Supporter",
  "status": "completed",
  "createdAt": "2025-01-06T14:00:00Z"
}
```

**Errors:**
- `400` – ValidationError (invalid coffee count, message too long, etc.)
- `404` – UserNotFound (creator doesn't exist)
- `402` – PaymentRequired (payment failed)

---

#### GET /api/supports/:id

Get details of a specific support.

**Response (200):**
```json
{
  "id": "sup_abc123",
  "creatorUsername": "sarahdesigns",
  "supporterName": "Alex Kim",
  "coffeeCount": 5,
  "amount": 25,
  "message": "Your design tutorials are amazing!",
  "status": "completed",
  "createdAt": "2025-01-06T10:00:00Z"
}
```

**Errors:**
- `404` – SupportNotFound

---

### Payments Endpoints

#### POST /api/payments/create-intent

Create a Stripe Payment Intent for coffee donation.

**Request:**
```json
{
  "creatorUsername": "sarahdesigns",
  "coffeeCount": 5,
  "message": "Keep up the great work!"
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_abc123_secret_xyz",
  "amount": 25,
  "currency": "usd"
}
```

**Errors:**
- `400` – ValidationError
- `404` – UserNotFound

---

#### POST /api/payments/webhooks/stripe

Stripe webhook handler (verify payment completion).

**Headers:**
```
stripe-signature: <webhook_signature>
```

**Request (from Stripe):**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_abc123",
      "amount": 2500,
      "metadata": {
        "creatorId": "usr_123abc",
        "coffeeCount": "5"
      }
    }
  }
}
```

**Response (200):**
```json
{
  "received": true
}
```

**Errors:**
- `400` – InvalidSignature (webhook verification failed)

---

#### GET /api/payments/history

Get payment history for authenticated user.

**Headers:**
```
Authorization: Bearer <session_token>
```

**Query Parameters:**
- `limit` (number, default: 20)
- `offset` (number, default: 0)

**Response (200):**
```json
{
  "payments": [
    {
      "id": "pay_xyz789",
      "amount": 25,
      "currency": "usd",
      "status": "succeeded",
      "supportId": "sup_abc123",
      "createdAt": "2025-01-06T10:00:00Z"
    }
  ],
  "total": 50,
  "hasMore": false
}
```

**Errors:**
- `401` – Unauthorized

---

### Stats Endpoints

#### GET /api/stats/:username

Get public statistics for a creator.

**Response (200):**
```json
{
  "totalSupports": 342,
  "totalEarnings": 1710,
  "totalCoffees": 568,
  "averageSupport": 5,
  "topSupporters": [
    {
      "name": "Sophie Turner",
      "avatar": "https://cdn.example.com/avatars/sophie.jpg",
      "totalAmount": 150,
      "supportCount": 10
    }
  ]
}
```

**Errors:**
- `404` – UserNotFound

---

## Request/Response Format

### Standard Response Envelope

**Success (2xx):**
```json
{
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-01-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Error (4xx, 5xx):**
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "meta": {
    "timestamp": "2025-01-06T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination

For list endpoints:

**Request:**
```
GET /api/supports?limit=20&offset=40
```

**Response:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 342,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

## Error Handling

### Error Types

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `ValidationError` | 400 | Invalid request data (schema validation failed) |
| `Unauthorized` | 401 | Authentication required or failed |
| `Forbidden` | 403 | Insufficient permissions |
| `NotFound` | 404 | Resource not found |
| `Conflict` | 409 | Resource already exists (duplicate) |
| `PaymentRequired` | 402 | Payment failed or required |
| `TooManyRequests` | 429 | Rate limit exceeded |
| `InternalServerError` | 500 | Server error |

### Validation Errors

Use Zod for validation:

```typescript
import { z } from 'zod'

const createSupportSchema = z.object({
  creatorUsername: z.string().min(3).max(30),
  coffeeCount: z.number().int().min(1).max(100),
  message: z.string().max(500).optional(),
  supporterName: z.string().min(2).max(50),
})

try {
  const data = createSupportSchema.parse(requestBody)
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors,
      },
      { status: 400 }
    )
  }
}
```

## Rate Limiting

### Recommended: Vercel Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'TooManyRequests', message: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Continue with request...
}
```

### Rate Limits (Recommended)

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth (login, signup) | 5 requests | 1 minute |
| Password reset | 3 requests | 5 minutes |
| Public reads (GET) | 100 requests | 1 minute |
| Authenticated writes (POST/PATCH) | 30 requests | 1 minute |
| Payments | 10 requests | 1 minute |

## Security

### Best Practices

✅ **DO:**
- Validate ALL input with Zod
- Use server-side authentication (NextAuth, Supabase)
- Sanitize user-generated content
- Use HTTPS only (automatic with Vercel)
- Implement rate limiting
- Hash passwords with bcrypt (if using credentials)
- Use parameterized queries (ORM handles this)
- Set secure HTTP headers (CSP, HSTS, etc.)

❌ **DON'T:**
- Trust client-side validation
- Expose internal error details to clients
- Log sensitive data (passwords, tokens)
- Use `eval()` or `Function()` with user input
- Store passwords in plain text

### CORS

Next.js Route Handlers allow same-origin by default. For external API access:

```typescript
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: '...' })

  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  return response
}
```

### Input Sanitization

```typescript
import { sanitize } from 'isomorphic-dompurify'

const sanitizedMessage = sanitize(userMessage, {
  ALLOWED_TAGS: [],  // Strip all HTML
  ALLOWED_ATTR: [],
})
```

---

**Last Updated:** 2025-01-06
**Status:** Specification (not implemented)

