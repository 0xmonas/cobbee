# AGENTS.md

## Purpose
This file helps AI agents work effectively and safely in this project. It provides a comprehensive map of the codebase structure, development workflows, and critical constraints for the BuyCoffee creator support platform.

## Quick facts
- **Languages/Stacks:** TypeScript + React 19 + Next.js 16 (App Router) — *Evidence:* [package.json:49](package.json#L49), [tsconfig.json:2-7](tsconfig.json#L2-L7), [app/layout.tsx](app/layout.tsx)
- **Package manager(s):** pnpm 9.x — *Evidence:* [pnpm-lock.yaml:1](pnpm-lock.yaml#L1)
- **Runtime versions:** Node.js 22+ (inferred from React 19), TypeScript 5.x — *Evidence:* [package.json:65,71](package.json#L65-L71)
- **Monorepo:** No, single repository — *Evidence:* No `turbo.json`, `nx.json`, or `pnpm-workspace.yaml` found
- **Key services:** 
  - **Frontend:** Next.js 16 App Router with RSC (Server Components)
  - **UI:** shadcn/ui components (New York style) + Tailwind CSS v4 + Radix UI primitives
  - **Styling:** Neo-brutalist design system with bold colors (#0000FF, #CCFF00, #FF6B35), thick borders, shadows
  - **Forms:** React Hook Form + Zod validation
  - **Analytics:** Vercel Analytics
  - **State:** Client-side React hooks, mock data layer
  - **Database/ORM:** None detected (currently mock data only)
  - **Testing:** None configured
  - **CI/CD:** None detected

## Dev environment tips

### Project startup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
Code navigation
Main entry: app/layout.tsx (root layout)
Landing page: app/page.tsx
Dynamic routes: app/[username]/page.tsx (creator profile pages)
Auth pages: app/login/page.tsx, app/signup/page.tsx
Dashboard: app/dashboard/page.tsx
Settings: app/settings/page.tsx, app/settings/payments/page.tsx
Data layer: lib/mock-data.ts (TypeScript interfaces + mock data)
Utilities: lib/utils.ts (cn helper for Tailwind)
Custom hooks: hooks/use-toast.ts, hooks/use-mobile.ts
UI components: components/ui/* (shadcn/ui primitives)
Feature components: components/coffee-support.tsx, components/recent-supporters.tsx, etc.
Run / Build / Lint / Typecheck / Test
Install
pnpm install
Dev
pnpm dev
# Runs: next dev
# Access at: http://localhost:3000
Build
pnpm build
# Runs: next build
# Note: TypeScript errors are ignored (ignoreBuildErrors: true in next.config.mjs)
Lint
pnpm lint
# Runs: eslint .
# Note: No eslintrc config detected; using Next.js defaults
Typecheck
npx tsc --noEmit
# TypeScript strict mode enabled in tsconfig.json
Test
⚠️ No test framework configured. Consider adding:
Vitest + Testing Library for unit/integration tests
Playwright or Cypress for E2E tests
Project layout
/
├── app/                          # Next.js App Router pages & layouts
│   ├── layout.tsx               # Root layout (metadata, fonts, analytics)
│   ├── page.tsx                 # Landing page (hero, features, CTA)
│   ├── globals.css              # Tailwind imports + CSS variables
│   ├── [username]/page.tsx      # Dynamic creator profile pages
│   ├── login/page.tsx           # Login page with OTP flow
│   ├── signup/page.tsx          # Signup page
│   ├── dashboard/page.tsx       # Creator dashboard (earnings, supporters)
│   ├── discover/page.tsx        # Discover creators page
│   ├── profile/edit/page.tsx    # Edit profile page
│   └── settings/                # Settings pages (general, payments)
├── components/                   # React components
│   ├── ui/                      # shadcn/ui primitives (50+ components)
│   ├── coffee-support.tsx       # Coffee donation form component
│   ├── recent-supporters.tsx    # Supporters list component
│   ├── landing-header.tsx       # Landing page header
│   ├── landing-footer.tsx       # Landing page footer
│   ├── user-menu.tsx            # User dropdown menu
│   └── theme-provider.tsx       # Dark mode provider (unused in neo-brutalist design)
├── lib/                         # Utilities & data
│   ├── utils.ts                 # cn() helper for Tailwind class merging
│   └── mock-data.ts             # Mock creators & support data (TypeScript interfaces)
├── hooks/                       # Custom React hooks
│   ├── use-toast.ts            # Toast notification hook
│   └── use-mobile.ts           # Mobile detection hook
├── public/                      # Static assets (avatars, placeholders)
├── styles/                      # Legacy styles directory (empty or minimal)
├── components.json              # shadcn/ui configuration
├── tsconfig.json                # TypeScript configuration (strict mode, path aliases)
├── next.config.mjs              # Next.js configuration (build settings)
├── postcss.config.mjs           # PostCSS configuration (Tailwind v4)
├── package.json                 # Dependencies & scripts
└── pnpm-lock.yaml               # pnpm lockfile
Important entry points
app/layout.tsx – Root layout, metadata, Google Fonts
app/page.tsx – Landing page
app/[username]/page.tsx – Creator profile pages
app/dashboard/page.tsx – Creator dashboard
lib/mock-data.ts – Data layer (mock)
components/coffee-support.tsx – Core donation flow
APIs & contracts
Current state: Mock data only
No backend/API routes detected. All data is client-side mock data.
Data layer: lib/mock-data.ts
TypeScript interfaces
// lib/mock-data.ts
export interface Creator {
  id: string
  username: string
  displayName: string
  bio: string
  avatar: string
  coverImage: string
  totalSupports: number
  coffeePrice: number
}

export interface Support {
  id: string
  supporterName: string
  supporterAvatar: string
  coffeeCount: number
  message: string
  timestamp: string
  amount: number
  txHash: string  // Blockchain transaction hash (mock)
}
Schema validation
Forms: React Hook Form + Zod (installed but usage not fully implemented)
Location: Form validation should be added to:
components/coffee-support.tsx
app/login/page.tsx
app/signup/page.tsx
app/profile/edit/page.tsx
Error model
⚠️ Not standardized. Currently ad-hoc client-side validation. Recommendation:
Define centralized error types (e.g., ValidationError, NotFoundError)
Use Zod for runtime validation
Implement consistent error boundaries (app/error.tsx)
When adding API routes (future)
Create app/api/[endpoint]/route.ts (Next.js Route Handlers)
Use Zod schemas for request/response validation
Return consistent JSON error responses:
{
  "error": "ValidationError",
  "message": "Coffee count must be between 1 and 100",
  "details": { "field": "coffeeCount", "value": 0 }
}
Database & migrations
Current state: No database
No ORM/database detected (no Prisma, Drizzle, Supabase, etc.)
Data source: lib/mock-data.ts with hardcoded arrays
Future integration (assumptions)
Assumption: This project may integrate:
Blockchain: Transaction hashes (txHash) in Support interface suggest Web3/crypto payments
Database options: Supabase, PostgreSQL + Prisma, or Firebase
Required tables: users/creators, supports, payments, settings
Migration strategy (when DB is added)
Install ORM (e.g., pnpm add prisma @prisma/client)
Create prisma/schema.prisma or supabase/migrations/
Define migration scripts in package.json:
"db:migrate": "prisma migrate dev",
"db:seed": "prisma db seed"
⚠️ Agents must NEVER run migrations in production – migrations are for dev/staging only
Env & secrets
Current state: No .env file
.env files are gitignored — Evidence: .gitignore:20
No environment validation detected (no env.ts, env.mjs, or Zod schema)
Recommended .env.example (for future)
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Database (when added)
DATABASE_URL=postgresql://user:pass@localhost:5432/buycoffee

# Auth (when added)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Payments (when added)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Blockchain (if Web3 integration)
WEB3_PROVIDER_URL=
CONTRACT_ADDRESS=
Secrets security
Never commit .env, .env.local, or any secrets to git
Vercel deployment: Add env vars in Vercel dashboard
Agents must NEVER log or output env var values in PRs
Coding standards
TypeScript
Strict mode enabled — Evidence: tsconfig.json:7
Target: ES6 — Evidence: tsconfig.json:5
Module resolution: Bundler (Next.js) — Evidence: tsconfig.json:11
Path aliases: @/* maps to project root — Evidence: tsconfig.json:21-23, components.json:13-18
Import aliases (use these!)
import { Button } from '@/components/ui/button'       // ✅ Preferred
import { cn } from '@/lib/utils'                       // ✅ Preferred
import { useToast } from '@/hooks/use-toast'           // ✅ Preferred

// NOT:
import { Button } from '../../../components/ui/button' // ❌ Avoid
Linting & formatting
ESLint: Default Next.js rules (no custom .eslintrc detected)
Prettier: Not detected; Assumption: may be configured in IDE/pre-commit hook
Run before commit: pnpm lint
Design system conventions
Neo-brutalist aesthetic:
Thick borders: border-4 border-black
Bold shadows: shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
Primary colors: Blue #0000FF, Lime #CCFF00, Orange #FF6B35, Black #000000, White #FFFFFF
Large, bold typography: text-3xl font-black
Rounded corners: rounded-3xl or rounded-full
Tailwind utility-first: Use cn() from lib/utils.ts to merge classes
Component variants: Use class-variance-authority (CVA) — Evidence: components/ui/button.tsx:7-37
Server/Client split (Next.js App Router)
Default: Server Components (RSC)
Client Components: Mark with "use client" directive when using:
React hooks (useState, useEffect, etc.)
Browser APIs (window, localStorage, etc.)
Event handlers (onClick, onChange, etc.)
Examples:
Server: app/[username]/page.tsx (fetches data, no interactivity)
Client: components/coffee-support.tsx:1, app/login/page.tsx:1
Module boundaries
app/                  # Pages (Server Components by default)
├── [route]/          # Route-specific logic
components/           # Reusable UI components
├── ui/               # Primitives (buttons, inputs, dialogs)
├── [feature].tsx     # Feature components (coffee-support, user-menu)
lib/                  # Pure utilities, data, constants
hooks/                # Custom React hooks (client-side only)
public/               # Static assets
Rules:
✅ app/ can import from components/, lib/, hooks/
✅ components/ can import from lib/, hooks/, other components/
✅ lib/ should be pure (no React dependencies)
❌ Avoid circular dependencies
Testing instructions
Current state: No tests
No test framework detected (no Jest, Vitest, Playwright, Cypress)
No test files (no .test.ts, .spec.ts, __tests__/ directories)
Recommended setup (for agents to implement)
# Unit/integration testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# E2E testing
pnpm add -D playwright @playwright/test
Test conventions (when added)
Location:
Unit tests: __tests__/[component].test.tsx or [component].test.tsx next to source
E2E tests: e2e/[feature].spec.ts
Commands:
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:e2e          # E2E tests only
pnpm test:watch        # Watch mode
Coverage: Aim for 80%+ on business logic (forms, data transformations)
CI requirement: All tests must pass before merge (when CI is added)
PR / Branch conventions
Current state: No CI/CD or git workflows detected
No .github/workflows/ directory
No branch protection rules visible
No CODEOWNERS file
Recommended conventions (for team adoption)
Branch naming:
feat/add-stripe-payments
fix/coffee-count-validation
refactor/extract-form-components
chore/add-vitest-config
Commit messages (Conventional Commits):
feat: add Stripe payment integration
fix: validate coffee count between 1-100
refactor: extract CoffeeForm from CoffeeSupport
chore: configure Vitest for unit testing
PR workflow:
Create feature branch from main
Make changes, commit with conventional messages
Run pnpm lint and fix errors
Run pnpm build to ensure no build errors
Open PR with description:
Summary: What changed and why
Test plan: How to verify (manual steps or test commands)
Screenshots: For UI changes
Request review (minimum 1 approval recommended)
Merge to main (squash or rebase recommended)
Agent playbook (how to work here)
General principles
Read-only mode: This codebase has no backend yet; treat it as a frontend prototype
Preserve design system: Maintain neo-brutalist aesthetic (bold borders, shadows, colors)
TypeScript strict mode: All code must pass tsc --noEmit
Server vs. Client: Default to Server Components; use "use client" only when necessary
Reuse patterns: Follow existing component structure (see components/coffee-support.tsx)
When adding a new page
Create app/[route]/page.tsx
Use Server Component by default
Import UI components from @/components/ui/
Match landing/dashboard design patterns (thick borders, bold shadows, chunky buttons)
Add metadata export for SEO
When adding a new component
UI primitive: Add to components/ui/ (use shadcn/ui CLI if possible)
Feature component: Add to components/ root
Use TypeScript interfaces for props (prefer named interfaces)
Export component as default or named export
Apply neo-brutalist styling:
<div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
When adding forms
Use React Hook Form + Zod:
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  coffeeCount: z.number().min(1).max(100),
  message: z.string().max(500).optional(),
})
Use Form components from @/components/ui/form
Handle errors with toast notifications (useToast from @/hooks/use-toast)
When adding API routes (future)
Create app/api/[endpoint]/route.ts
Export async functions: GET, POST, PUT, DELETE
Use NextRequest/NextResponse from next/server
Validate input with Zod schemas
Return consistent error responses (see "APIs & contracts" section)
Security checklist
✅ Never hardcode secrets – use env vars
✅ Sanitize user input – especially for messages, names
✅ Validate on server – never trust client-side validation alone
✅ Avoid XSS – use React's built-in escaping (don't use dangerouslySetInnerHTML)
✅ Rate limiting – add when API routes are created
❌ Never commit .env files, API keys, or sensitive data
What NOT to do
❌ Don't run database migrations (none exist yet)
❌ Don't push to production (no CI/CD configured)
❌ Don't bypass TypeScript errors (strict mode is required)
❌ Don't ignore build warnings (fix next build issues)
❌ Don't break design system (maintain neo-brutalist aesthetic)
Troubleshooting
Common issues
1. pnpm install fails
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
2. Next.js build errors
Issue: TypeScript errors block build
Temporary fix: ignoreBuildErrors: true in next.config.mjs:3-5
Proper fix: Resolve TypeScript errors with npx tsc --noEmit
3. Path alias imports not working
Ensure tsconfig.json:21-23 has "@/*": ["./*"]
Restart TypeScript server in IDE
4. Tailwind classes not applying
Check postcss.config.mjs has @tailwindcss/postcss
Ensure app/globals.css:1 imports tailwindcss
Restart dev server (pnpm dev)
5. React 19 compatibility
Some packages may not support React 19 yet
Check pnpm-lock.yaml for peer dependency warnings
Use --legacy-peer-deps if needed (pnpm: --force)
6. "use client" directive missing
Symptom: Hooks error in Server Components
Fix: Add "use client" at top of file (see components/coffee-support.tsx:1)
References (evidence)
Key files supporting this document
package.json:49 – Next.js 16.0.0
package.json:51-52 – React 19.2.0
pnpm-lock.yaml:1 – pnpm lockfile version 9.0
tsconfig.json:7 – TypeScript strict mode enabled
tsconfig.json:21-23 – Path aliases @/*
components.json:1-21 – shadcn/ui config (New York style, RSC)
next.config.mjs:3-5 – Build config (ignoreBuildErrors)
app/layout.tsx:10-14 – Metadata & Vercel Analytics
app/globals.css:1-41 – Tailwind v4 + neo-brutalist CSS variables
lib/mock-data.ts:1-186 – TypeScript interfaces & mock data
app/[username]/page.tsx:1-76 – Dynamic routes pattern
components/coffee-support.tsx:1-60 – Client component with forms
package.json:5-9 – npm scripts (dev, build, lint, start)
.gitignore:20 – .env files ignored
Assumptions made
Assumption: Node.js 22+ required (inferred from React 19 compatibility)
Assumption: No backend/API exists yet; entire app is frontend-only
Assumption: Blockchain integration planned (based on txHash field in Support interface)
Assumption: Prettier may be configured via IDE or pre-commit hook (not in package.json)
Assumption: Production deployment target is Vercel (based on @vercel/analytics and Next.js)
Assumption: Future auth system may use NextAuth.js or Supabase (common Next.js patterns)
Assumption: No Docker/containerization needed (Vercel handles deployment)