#!/usr/bin/env tsx
/**
 * Security Audit Script
 *
 * Checks for potential security vulnerabilities:
 * 1. Service role key exposure in client bundles
 * 2. Environment variables leaking to client
 * 3. Sensitive data in public files
 * 4. Server-only code being bundled for client
 *
 * Run: pnpm security-audit
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  file: string
  line?: number
  message: string
  recommendation: string
}

const issues: SecurityIssue[] = []

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log('cyan', `  ${title}`)
  console.log('='.repeat(80) + '\n')
}

function addIssue(issue: SecurityIssue) {
  issues.push(issue)
  const severityColor = {
    critical: 'red',
    high: 'red',
    medium: 'yellow',
    low: 'blue',
  }[issue.severity] as keyof typeof colors

  log(severityColor, `[${issue.severity.toUpperCase()}] ${issue.category}: ${issue.message}`)
  console.log(`  File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
  console.log(`  ${colors.cyan}→ ${issue.recommendation}${colors.reset}\n`)
}

/**
 * Check 1: Scan for service role key in source files
 */
function checkServiceRoleKeyInSource() {
  logSection('🔍 Checking Source Files for Service Role Key Exposure')

  const sensitivePatterns = [
    { name: 'Service Role Key', pattern: /service[_-]?role[_-]?key/i },
    { name: 'Hardcoded Service Key', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g }, // JWT pattern
    { name: 'Supabase Service Key', pattern: /SUPABASE[_-]?SERVICE[_-]?ROLE/i },
  ]

  const filesToCheck = [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}',
  ]

  filesToCheck.forEach((globPattern) => {
    try {
      const files = execSync(`find ${globPattern.replace('**/*.', '')} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null || true`, {
        encoding: 'utf-8',
        cwd: process.cwd(),
      })
        .split('\n')
        .filter(Boolean)

      files.forEach((file) => {
        if (!fs.existsSync(file)) return

        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          sensitivePatterns.forEach(({ name, pattern }) => {
            if (pattern.test(line)) {
              // Ignore comments and env var declarations
              if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('process.env')) {
                return
              }

              addIssue({
                severity: 'critical',
                category: 'Secret Exposure',
                file,
                line: index + 1,
                message: `Potential ${name} found in source code`,
                recommendation: 'Remove hardcoded secrets. Use environment variables instead.',
              })
            }
          })
        })
      })
    } catch (error) {
      // Ignore file not found errors
    }
  })

  log('green', '✓ Source file scan completed')
}

/**
 * Check 2: Verify client-side code doesn't use service role
 */
function checkClientSideCode() {
  logSection('🌐 Checking Client-Side Components for Server-Only Code')

  const serverOnlyPatterns = [
    { name: 'Admin Client Import', pattern: /from\s+['"]@\/lib\/supabase\/admin['"]/g },
    { name: 'createAdminClient Usage', pattern: /createAdminClient\(/g },
    { name: 'Service Role in Client', pattern: /SUPABASE_SERVICE_ROLE_KEY/g },
  ]

  const clientDirs = ['components', 'hooks', 'context']

  clientDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return

    const files = execSync(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })
      .split('\n')
      .filter(Boolean)

    files.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')

      // Check for "use client" directive
      const isClientComponent = lines.some((line) => line.trim() === '"use client"' || line.trim() === "'use client'")

      if (isClientComponent) {
        lines.forEach((line, index) => {
          serverOnlyPatterns.forEach(({ name, pattern }) => {
            if (pattern.test(line)) {
              addIssue({
                severity: 'critical',
                category: 'Client-Side Server Code',
                file,
                line: index + 1,
                message: `${name} used in client component`,
                recommendation: 'Move server-only code to API routes or server components.',
              })
            }
          })
        })
      }
    })
  })

  log('green', '✓ Client-side code check completed')
}

/**
 * Check 3: Verify environment variables are properly prefixed
 */
function checkEnvironmentVariables() {
  logSection('🔐 Checking Environment Variable Configuration')

  const envFiles = ['.env.local', '.env', '.env.example']

  envFiles.forEach((envFile) => {
    if (!fs.existsSync(envFile)) return

    const content = fs.readFileSync(envFile, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) return

      const [key] = line.split('=')
      if (!key) return

      const trimmedKey = key.trim()

      // Check for sensitive keys without NEXT_PUBLIC_ prefix
      const sensitiveKeys = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'PRIVATE_KEY',
        'SECRET_KEY',
        'API_SECRET',
        'CDP_API_KEY_SECRET',
      ]

      if (sensitiveKeys.some((sensitive) => trimmedKey.includes(sensitive))) {
        if (trimmedKey.startsWith('NEXT_PUBLIC_')) {
          addIssue({
            severity: 'critical',
            category: 'Public Secret Exposure',
            file: envFile,
            line: index + 1,
            message: `Sensitive key "${trimmedKey}" has NEXT_PUBLIC_ prefix`,
            recommendation: 'Remove NEXT_PUBLIC_ prefix from sensitive keys. They will be exposed to the browser!',
          })
        }
      }
    })
  })

  log('green', '✓ Environment variable check completed')
}

/**
 * Check 4: Scan Next.js build output for secrets
 */
function checkBuildOutput() {
  logSection('📦 Checking Next.js Build Output')

  const buildDir = '.next'
  if (!fs.existsSync(buildDir)) {
    log('yellow', '⚠ Build directory not found. Run `pnpm build` first for complete audit.')
    return
  }

  const staticDir = path.join(buildDir, 'static')
  if (!fs.existsSync(staticDir)) {
    log('yellow', '⚠ Static build output not found')
    return
  }

  // Search for JWT patterns in client bundles
  const jwtPattern = /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}/g

  try {
    const jsFiles = execSync(`find ${staticDir} -type f -name "*.js"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })
      .split('\n')
      .filter(Boolean)

    jsFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(jwtPattern)

      if (matches) {
        matches.forEach((match) => {
          // Decode JWT to check if it's an anon key (safe) or service role (dangerous)
          try {
            const payload = JSON.parse(Buffer.from(match.split('.')[1], 'base64').toString())

            // Anon keys are safe - they're meant to be public
            if (payload.role === 'anon' || payload.role === 'authenticated') {
              return // Skip anon keys
            }

            // Service role or other sensitive roles
            if (payload.role === 'service_role' || payload.role === 'admin') {
              addIssue({
                severity: 'critical',
                category: 'Service Role Key in Build Output',
                file,
                message: `CRITICAL: ${payload.role} JWT token found in client bundle!`,
                recommendation: 'Service role key found in build output! This will expose your database. Remove immediately and rotate the key!',
              })
              return
            }

            // Unknown JWT - warn just in case
            addIssue({
              severity: 'high',
              category: 'Unknown JWT in Build Output',
              file,
              message: `Unknown JWT token found in client bundle: role=${payload.role}`,
              recommendation: 'Verify this JWT is safe to expose. If it contains sensitive permissions, remove it.',
            })
          } catch {
            // Could not decode - assume it might be sensitive
            addIssue({
              severity: 'medium',
              category: 'Potential Secret in Build Output',
              file,
              message: `Potential JWT-like token found in client bundle: ${match.substring(0, 50)}...`,
              recommendation: 'Could not decode this token. Verify it does not contain sensitive data.',
            })
          }
        })
      }
    })
  } catch (error) {
    log('yellow', '⚠ Could not scan build output')
  }

  log('green', '✓ Build output check completed')
}

/**
 * Check 5: Verify API routes use proper authentication
 */
function checkAPIRoutes() {
  logSection('🛡️  Checking API Routes for Proper Authentication')

  const apiDir = 'app/api'
  if (!fs.existsSync(apiDir)) return

  const routeFiles = execSync(`find ${apiDir} -type f -name "route.ts" -o -name "route.tsx"`, {
    encoding: 'utf-8',
    cwd: process.cwd(),
  })
    .split('\n')
    .filter(Boolean)

  routeFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8')

    // Check if route uses admin client
    const usesAdminClient = /createAdminClient|from\s+['"]@\/lib\/supabase\/admin['"]/.test(content)

    if (usesAdminClient) {
      // Check for proper authentication checks
      const hasAuthCheck = /auth\.getUser|auth\.getSession|headers\(\)/.test(content)

      if (!hasAuthCheck) {
        addIssue({
          severity: 'high',
          category: 'Missing Authentication',
          file,
          message: 'API route uses admin client without authentication check',
          recommendation: 'Add authentication checks before using admin client. Verify user identity and permissions.',
        })
      }
    }
  })

  log('green', '✓ API route authentication check completed')
}

/**
 * Check 6: Verify public directory doesn't contain secrets
 */
function checkPublicDirectory() {
  logSection('📂 Checking Public Directory for Sensitive Files')

  const publicDir = 'public'
  if (!fs.existsSync(publicDir)) return

  const sensitiveFiles = ['.env', '.env.local', '.env.production', 'config.json', 'secrets.json']

  try {
    const files = execSync(`find ${publicDir} -type f`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })
      .split('\n')
      .filter(Boolean)

    files.forEach((file) => {
      const basename = path.basename(file)

      if (sensitiveFiles.includes(basename)) {
        addIssue({
          severity: 'critical',
          category: 'Public Secret File',
          file,
          message: `Sensitive file "${basename}" found in public directory`,
          recommendation: 'Remove this file immediately! Public directory is accessible to all users.',
        })
      }
    })
  } catch (error) {
    // Ignore errors
  }

  log('green', '✓ Public directory check completed')
}

/**
 * Check 7: Verify CDP API keys are not exposed
 */
function checkCDPKeys() {
  logSection('🔑 Checking CDP/Coinbase API Key Security')

  const cdpKeyPatterns = [
    { name: 'CDP API Key ID', pattern: /CDP_API_KEY_ID/g },
    { name: 'CDP API Key Secret', pattern: /CDP_API_KEY_SECRET/g },
    { name: 'Coinbase API Key', pattern: /COINBASE.*API.*KEY/gi },
  ]

  // Check client-side files
  const clientDirs = ['components', 'hooks', 'app', 'context']

  clientDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return

    try {
      const files = execSync(`find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)`, {
        encoding: 'utf-8',
        cwd: process.cwd(),
      })
        .split('\n')
        .filter(Boolean)

      files.forEach((file) => {
        // Skip API routes - they're server-side
        if (file.includes('/api/')) return

        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        // Check for "use client" directive
        const isClientComponent = lines.some((line) => line.trim() === '"use client"' || line.trim() === "'use client'")

        if (isClientComponent) {
          lines.forEach((line, index) => {
            cdpKeyPatterns.forEach(({ name, pattern }) => {
              if (pattern.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
                addIssue({
                  severity: 'critical',
                  category: 'CDP Key Exposure',
                  file,
                  line: index + 1,
                  message: `${name} referenced in client component`,
                  recommendation: 'CDP API keys must NEVER be used in client components. Move to server-side API routes.',
                })
              }
            })
          })
        }
      })
    } catch (error) {
      // Ignore
    }
  })

  log('green', '✓ CDP API key check completed')
}

/**
 * Check 8: Verify x402 payment security
 */
function checkX402Security() {
  logSection('💳 Checking x402 Payment Security')

  // Check for proper nonce validation
  const paymentRoutes = ['app/api/support/buy/route.ts']

  paymentRoutes.forEach((route) => {
    if (!fs.existsSync(route)) return

    const content = fs.readFileSync(route, 'utf-8')

    // Check for replay attack protection (nonce tracking)
    const hasNonceTracking = /payment_nonce|nonce.*tracking|blacklist.*nonce/i.test(content)
    if (!hasNonceTracking) {
      addIssue({
        severity: 'high',
        category: 'Payment Security',
        file: route,
        message: 'No nonce tracking found in payment route - vulnerable to replay attacks',
        recommendation: 'Implement nonce tracking to prevent payment replay attacks.',
      })
    }

    // Check for facilitator URL validation
    const hasFacilitatorValidation = /validateFacilitatorUrl|TRUSTED_FACILITATORS|whitelist/i.test(content)
    if (!hasFacilitatorValidation) {
      addIssue({
        severity: 'high',
        category: 'Payment Security',
        file: route,
        message: 'No facilitator URL validation found',
        recommendation: 'Validate facilitator URLs against a whitelist to prevent malicious facilitators.',
      })
    }

    // Check for self-payment prevention
    const hasSelfPaymentCheck = /supporter.*creator.*same|cannot.*support.*yourself/i.test(content)
    if (!hasSelfPaymentCheck) {
      addIssue({
        severity: 'medium',
        category: 'Payment Logic',
        file: route,
        message: 'No self-payment prevention found',
        recommendation: 'Add check to prevent users from supporting themselves.',
      })
    }
  })

  log('green', '✓ x402 payment security check completed')
}

/**
 * Check 9: Verify wallet address handling
 */
function checkWalletSecurity() {
  logSection('👛 Checking Wallet Address Security')

  // Check for proper wallet address validation
  const walletFiles = ['lib/x402-client.ts', 'app/api/support/buy/route.ts']

  walletFiles.forEach((file) => {
    if (!fs.existsSync(file)) return

    const content = fs.readFileSync(file, 'utf-8')

    // Check for checksum address validation (EIP-55)
    const hasChecksumValidation = /getAddress|isAddress|checksum/i.test(content)
    if (!hasChecksumValidation) {
      addIssue({
        severity: 'low',
        category: 'Wallet Security',
        file,
        message: 'No EIP-55 checksum validation found for addresses',
        recommendation: 'Use viem getAddress() to validate and normalize wallet addresses.',
      })
    }
  })

  log('green', '✓ Wallet address security check completed')
}

/**
 * Check 10: Verify CORS and CSP configuration
 */
function checkSecurityHeaders() {
  logSection('🔒 Checking Security Headers Configuration')

  const configFile = 'next.config.mjs'
  if (!fs.existsSync(configFile)) {
    log('yellow', '⚠ next.config.mjs not found')
    return
  }

  const content = fs.readFileSync(configFile, 'utf-8')

  // Check for CSP
  if (!content.includes('Content-Security-Policy')) {
    addIssue({
      severity: 'high',
      category: 'Security Headers',
      file: configFile,
      message: 'No Content-Security-Policy configured',
      recommendation: 'Add CSP headers to prevent XSS attacks.',
    })
  }

  // Check for unsafe-inline in CSP (should be avoided if possible)
  if (content.includes("'unsafe-inline'")) {
    addIssue({
      severity: 'low',
      category: 'Security Headers',
      file: configFile,
      message: "CSP allows 'unsafe-inline' scripts/styles",
      recommendation: "Consider using nonces or hashes instead of 'unsafe-inline' for better security.",
    })
  }

  // Check for CORS configuration
  if (!content.includes('Access-Control-Allow-Origin')) {
    addIssue({
      severity: 'medium',
      category: 'Security Headers',
      file: configFile,
      message: 'No CORS configuration found',
      recommendation: 'Add CORS headers to control which origins can access your API.',
    })
  }

  log('green', '✓ Security headers check completed')
}

/**
 * Generate security report
 */
function generateReport() {
  logSection('📊 Security Audit Report')

  const criticalIssues = issues.filter((i) => i.severity === 'critical')
  const highIssues = issues.filter((i) => i.severity === 'high')
  const mediumIssues = issues.filter((i) => i.severity === 'medium')
  const lowIssues = issues.filter((i) => i.severity === 'low')

  console.log(`Total Issues Found: ${colors.bold}${issues.length}${colors.reset}\n`)
  console.log(`  ${colors.red}● Critical: ${criticalIssues.length}${colors.reset}`)
  console.log(`  ${colors.red}● High:     ${highIssues.length}${colors.reset}`)
  console.log(`  ${colors.yellow}● Medium:   ${mediumIssues.length}${colors.reset}`)
  console.log(`  ${colors.blue}● Low:      ${lowIssues.length}${colors.reset}`)

  if (issues.length === 0) {
    console.log(`\n${colors.green}${colors.bold}✓ No security issues found! Your application is secure.${colors.reset}\n`)
    return 0
  }

  console.log('\n' + '='.repeat(80))

  if (criticalIssues.length > 0 || highIssues.length > 0) {
    console.log(`\n${colors.red}${colors.bold}❌ CRITICAL/HIGH SECURITY ISSUES FOUND!${colors.reset}`)
    console.log(`${colors.red}Please fix these issues immediately before deploying to production.${colors.reset}\n`)
    return 1
  }

  if (mediumIssues.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}⚠ WARNING: Medium severity issues found.${colors.reset}`)
    console.log(`${colors.yellow}Consider fixing these issues before deploying.${colors.reset}\n`)
    return 0
  }

  return 0
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.cyan}${colors.bold}🔒 COBBEE SECURITY AUDIT${colors.reset}`)
  console.log(`${colors.cyan}Scanning for sensitive data exposure and security vulnerabilities...${colors.reset}\n`)

  // Core security checks
  checkServiceRoleKeyInSource()
  checkClientSideCode()
  checkEnvironmentVariables()
  checkBuildOutput()
  checkAPIRoutes()
  checkPublicDirectory()

  // Blockchain & payment security checks
  checkCDPKeys()
  checkX402Security()
  checkWalletSecurity()
  checkSecurityHeaders()

  const exitCode = generateReport()
  process.exit(exitCode)
}

main()
