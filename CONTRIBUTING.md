# Contributing to BuyCoffee

Thank you for your interest in contributing to BuyCoffee! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Need Help?](#need-help)

## Getting Started

### Prerequisites

- **Node.js:** 20.x or higher (recommended: 22.x for React 19 compatibility)
- **pnpm:** 9.x (install with `npm install -g pnpm`)
- **Git:** Latest stable version

### Initial Setup

1. **Fork the repository** (if external contributor)

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/buycoffee.git
   cd buycoffee
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values (if needed for development)
   ```

5. **Start development server:**
   ```bash
   pnpm dev
   ```

6. **Verify everything works:**
   - Open http://localhost:3000
   - Test navigation between pages
   - Verify no console errors

## Development Workflow

### 1. Create a New Branch

Always create a new branch for your work:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add comments for complex logic
- Keep changes focused (one feature/fix per PR)

### 3. Test Your Changes

```bash
# Run linting
pnpm lint

# Build the project (ensure no errors)
pnpm build

# Test manually in browser
pnpm dev
```

### 4. Commit Your Changes

Follow the [Commit Messages](#commit-messages) guidelines below.

### 5. Push to Your Fork

```bash
git push origin feat/your-feature-name
```

### 6. Open a Pull Request

See [Pull Request Process](#pull-request-process) below.

## Branch Naming

Use descriptive branch names with the following prefixes:

| Prefix      | Purpose                          | Example                          |
|-------------|----------------------------------|----------------------------------|
| `feat/`     | New features                     | `feat/add-payment-history`       |
| `fix/`      | Bug fixes                        | `fix/coffee-count-validation`    |
| `refactor/` | Code refactoring                 | `refactor/extract-form-hooks`    |
| `style/`    | UI/styling changes               | `style/update-button-shadows`    |
| `docs/`     | Documentation updates            | `docs/add-api-examples`          |
| `test/`     | Adding or updating tests         | `test/add-coffee-form-tests`     |
| `chore/`    | Build/config/dependency updates  | `chore/update-dependencies`      |
| `perf/`     | Performance improvements         | `perf/optimize-image-loading`    |

**Examples:**
```bash
git checkout -b feat/add-stripe-integration
git checkout -b fix/dashboard-earnings-calculation
git checkout -b refactor/split-coffee-support-component
git checkout -b docs/update-readme
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `style`: Changes that don't affect code meaning (formatting, whitespace)
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvements
- `revert`: Reverting a previous commit

### Scope (optional)

The scope indicates what part of the codebase is affected:

- `auth`: Authentication-related
- `payments`: Payment processing
- `profile`: User profile features
- `dashboard`: Dashboard functionality
- `ui`: UI components
- `api`: API routes
- `deps`: Dependencies

### Examples

**Good commit messages:**

```bash
feat(payments): add Stripe checkout integration

Integrate Stripe Elements for secure payment processing.
- Add CheckoutForm component
- Configure Stripe webhook handler
- Update coffee-support to use Stripe

Closes #42

---

fix(dashboard): correct earnings calculation

Total earnings were not including supporter tips.
Fixed calculation in dashboard stats component.

---

refactor(ui): extract Button variants to CVA

Move button styling logic to class-variance-authority
for better maintainability and type safety.

---

docs: add API documentation

Add comprehensive API route documentation with examples
for all endpoints in /app/api.

---

chore(deps): update Next.js to 16.1.0
```

**Bad commit messages:**

```bash
fixed bug
update stuff
WIP
asdfasdf
final version (no really this time)
```

### Writing Good Commit Messages

✅ **DO:**
- Use imperative mood ("add feature" not "added feature")
- Keep subject line under 72 characters
- Capitalize first letter of subject
- Don't end subject with a period
- Provide context in the body if needed
- Reference issue numbers (e.g., `Closes #123`)

❌ **DON'T:**
- Use vague messages like "fix", "update", "changes"
- Include multiple unrelated changes in one commit
- Write commit messages in past tense
- Commit commented-out code or console.logs

## Pull Request Process

### 1. Prepare Your PR

Before opening a PR, ensure:

- ✅ Code follows [Code Style](#code-style) guidelines
- ✅ `pnpm lint` passes with no errors
- ✅ `pnpm build` completes successfully
- ✅ Manual testing completed
- ✅ No console errors or warnings
- ✅ Commits follow [Commit Messages](#commit-messages) format
- ✅ No merge conflicts with `main` branch

### 2. Write a Clear PR Description

Use this template:

```markdown
## Summary
Brief description of what this PR does and why.

## Changes
- List of key changes
- Another change
- One more change

## Test Plan
How to verify this PR works:
1. Step-by-step instructions
2. Expected behavior
3. Edge cases tested

## Screenshots (if UI changes)
Before | After
------ | -----
![before](url) | ![after](url)

## Related Issues
Closes #123
Relates to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Manually tested in browser
- [ ] No console errors/warnings
- [ ] Documentation updated (if needed)
```

### 3. Request Review

- Assign at least one reviewer
- Respond to feedback promptly
- Make requested changes in new commits (don't force-push during review)
- Mark conversations as resolved when addressed

### 4. Merge

Once approved:
- **Squash and merge** (for feature branches with many commits)
- **Rebase and merge** (for clean commit history)
- Delete branch after merging

## Code Style

### TypeScript

- ✅ **Use TypeScript strict mode** (already enabled)
- ✅ **Prefer interfaces over types** for object shapes
- ✅ **Use explicit return types** for functions (when not obvious)
- ✅ **Avoid `any`** – use `unknown` or proper types
- ✅ **Use optional chaining** (`?.`) and nullish coalescing (`??`)

**Good:**
```typescript
interface CoffeeSupportProps {
  creator: Creator
  onSuccess?: () => void
}

function calculateTotal(count: number, price: number): number {
  return count * price
}
```

**Bad:**
```typescript
type CoffeeSupportProps = {  // Use interface instead
  creator: any  // Avoid any
  onSuccess: Function  // Be specific
}

function calculateTotal(count, price) {  // Missing types
  return count * price
}
```

### React

- ✅ **Prefer function components** over class components
- ✅ **Use Server Components by default** (only add `"use client"` when needed)
- ✅ **Destructure props** in function signature
- ✅ **Use semantic HTML** (`<button>` not `<div onClick>`)
- ✅ **Extract complex JSX** into separate components

**Good:**
```typescript
// Server Component (default)
export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = getUserByUsername(params.username)
  return <UserProfile user={user} />
}

// Client Component (when needed)
"use client"
export function CoffeeForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [count, setCount] = useState(1)
  // ...
}
```

### Styling

- ✅ **Use Tailwind utility classes** (avoid inline styles)
- ✅ **Use `cn()` helper** from `@/lib/utils` for conditional classes
- ✅ **Follow neo-brutalist design system:**
  - Thick borders: `border-4 border-black`
  - Bold shadows: `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`
  - Brand colors: `bg-[#0000FF]`, `bg-[#CCFF00]`, `bg-[#FF6B35]`
  - Large text: `text-3xl font-black`
  - Rounded corners: `rounded-3xl` or `rounded-full`

**Good:**
```typescript
<Button
  className={cn(
    "bg-[#CCFF00] border-4 border-black rounded-full",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  Support
</Button>
```

**Bad:**
```typescript
<button style={{ backgroundColor: '#CCFF00', border: '4px solid black' }}>
  Support
</button>
```

### File Organization

- ✅ **Group imports:** React → Next.js → External → Internal → Types
- ✅ **Use path aliases:** `@/components` not `../../components`
- ✅ **One component per file** (except tightly coupled sub-components)
- ✅ **Co-locate related files** (component + styles + tests)

**Good:**
```typescript
// React
import { useState } from 'react'

// Next.js
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// External
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Internal
import { calculateTotal } from './utils'

// Types
import type { Creator } from '@/lib/mock-data'
```

### Naming Conventions

| Item                  | Convention          | Example                    |
|-----------------------|---------------------|----------------------------|
| Components            | PascalCase          | `CoffeeSupport`            |
| Files (components)    | kebab-case          | `coffee-support.tsx`       |
| Files (pages)         | kebab-case          | `page.tsx`, `layout.tsx`   |
| Hooks                 | camelCase (use*)    | `useToast`, `useMobile`    |
| Utilities             | camelCase           | `cn`, `formatCurrency`     |
| Constants             | UPPER_SNAKE_CASE    | `MAX_COFFEE_COUNT`         |
| Types/Interfaces      | PascalCase          | `Creator`, `Support`       |

## Testing

### Current State
No testing framework is currently configured. When adding tests:

### Unit Tests (when Vitest is added)
```bash
# Install
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
pnpm test
pnpm test:watch
```

**Test file naming:**
- `[component].test.tsx` (next to component)
- Or `__tests__/[component].test.tsx`

### E2E Tests (when Playwright is added)
```bash
# Install
pnpm add -D playwright @playwright/test

# Run tests
pnpm test:e2e
```

**Test coverage expectations:**
- **Critical paths:** 100% (payment flows, auth)
- **Business logic:** 80%+ (calculations, validations)
- **UI components:** 60%+ (interactions, edge cases)

## Code Review Guidelines

### As a Reviewer

- ✅ Be constructive and respectful
- ✅ Ask questions, don't demand changes
- ✅ Approve if minor issues (can be fixed later)
- ✅ Test the changes locally if needed
- ✅ Check for security issues, performance problems

**Good feedback:**
> "Could we extract this form logic into a custom hook? It might make the component easier to test."

**Bad feedback:**
> "This code is bad. Rewrite it."

### As a Contributor

- ✅ Don't take feedback personally
- ✅ Ask for clarification if unclear
- ✅ Explain your reasoning if you disagree
- ✅ Mark conversations as resolved when addressed
- ✅ Thank reviewers for their time

## Security

### Never Commit

- ❌ API keys, secrets, tokens
- ❌ `.env`, `.env.local` files
- ❌ Private keys, certificates
- ❌ Database credentials
- ❌ User data or PII

### Always

- ✅ Use environment variables for secrets
- ✅ Validate user input (client AND server)
- ✅ Sanitize data before rendering
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

## Need Help?

- 📖 **Documentation:** See [AGENTS.md](AGENTS.md) for codebase overview
- 🐛 **Bug Reports:** Open an issue with reproduction steps
- 💡 **Feature Requests:** Open an issue with use case description
- 💬 **Questions:** Open a discussion or ask in PR comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to BuyCoffee! 🙏
