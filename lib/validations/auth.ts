import { z } from "zod"

const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "fakeinbox.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
]

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
    .refine((val) => val.trim().length > 0, "Full name is required")
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      "Please enter both first and last name"
    ),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .regex(/^[a-zA-Z0-9]/, "Username must start with a letter or number")
    .regex(/[a-zA-Z0-9]$/, "Username must end with a letter or number")
    .refine((val) => !val.startsWith("@"), "Username cannot start with @"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters")
    .toLowerCase()
    .refine((email) => {
      const domain = email.split("@")[1]
      return !DISPOSABLE_EMAIL_DOMAINS.includes(domain)
    }, "Disposable email addresses are not allowed"),

  walletAddress: z
    .string()
    .min(1, "Wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum wallet address"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),

  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid Ethereum wallet address")
    .optional(),
})

export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
