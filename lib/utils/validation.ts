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

export function validateFullName(name: string): string | null {
  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return "Full name must be at least 2 characters"
  }

  if (trimmed.length > 50) {
    return "Full name must not exceed 50 characters"
  }

  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return "Full name can only contain letters and spaces"
  }

  if (trimmed.split(/\s+/).length < 2) {
    return "Please enter both first and last name"
  }

  return null
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim()

  if (trimmed.startsWith("@")) {
    return "Username cannot start with @"
  }

  if (trimmed.length < 3) {
    return "Username must be at least 3 characters"
  }

  if (trimmed.length > 20) {
    return "Username must not exceed 20 characters"
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, underscores, and hyphens"
  }

  if (!/^[a-zA-Z0-9]/.test(trimmed)) {
    return "Username must start with a letter or number"
  }

  if (!/[a-zA-Z0-9]$/.test(trimmed)) {
    return "Username must end with a letter or number"
  }

  return null
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed) {
    return "Email is required"
  }

  if (trimmed.length > 100) {
    return "Email must not exceed 100 characters"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return "Please enter a valid email address"
  }

  const domain = trimmed.split("@")[1]
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return "Disposable email addresses are not allowed"
  }

  return null
}

export function validateOTP(otp: string): string | null {
  if (otp.length !== 6) {
    return "OTP must be exactly 6 digits"
  }

  if (!/^\d{6}$/.test(otp)) {
    return "OTP must contain only numbers"
  }

  return null
}

export function validateWalletAddress(address: string): string | null {
  const trimmed = address.trim()

  if (!trimmed) {
    return "Wallet address is required"
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return "Please enter a valid Ethereum wallet address"
  }

  return null
}

export function validateBio(bio: string): string | null {
  const trimmed = bio.trim()

  if (trimmed.length > 500) {
    return "Bio must not exceed 500 characters"
  }

  return null
}

export function validateSocialUsername(username: string): string | null {
  if (!username) {
    return null
  }

  const trimmed = username.trim()

  if (trimmed.startsWith("@")) {
    return "Username cannot start with @"
  }

  if (trimmed.length > 30) {
    return "Username must not exceed 30 characters"
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, underscores, and hyphens"
  }

  return null
}

export function validateSupporterName(name: string): string | null {
  const trimmed = name.trim()

  if (!trimmed) {
    return "Name is required"
  }

  if (trimmed.length < 2) {
    return "Name must be at least 2 characters"
  }

  if (trimmed.length > 50) {
    return "Name must not exceed 50 characters"
  }

  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return "Name can only contain letters and spaces"
  }

  return null
}

export function validateSupportMessage(message: string): string | null {
  if (!message) {
    return null // Message is optional
  }

  const trimmed = message.trim()

  if (trimmed.length > 500) {
    return "Message must not exceed 500 characters"
  }

  return null
}

export function validateProfileForm(formData: {
  displayName: string
  username: string
  bio: string
  twitter?: string
  instagram?: string
  github?: string
  tiktok?: string
  opensea?: string
}): Record<string, string> {
  const errors: Record<string, string> = {}

  const displayNameError = validateFullName(formData.displayName)
  if (displayNameError) errors.displayName = displayNameError

  const usernameError = validateUsername(formData.username)
  if (usernameError) errors.username = usernameError

  const bioError = validateBio(formData.bio)
  if (bioError) errors.bio = bioError

  if (formData.twitter) {
    const twitterError = validateSocialUsername(formData.twitter)
    if (twitterError) errors.twitter = twitterError
  }

  if (formData.instagram) {
    const instagramError = validateSocialUsername(formData.instagram)
    if (instagramError) errors.instagram = instagramError
  }

  if (formData.github) {
    const githubError = validateSocialUsername(formData.github)
    if (githubError) errors.github = githubError
  }

  if (formData.tiktok) {
    const tiktokError = validateSocialUsername(formData.tiktok)
    if (tiktokError) errors.tiktok = tiktokError
  }

  if (formData.opensea) {
    const openseaError = validateSocialUsername(formData.opensea)
    if (openseaError) errors.opensea = openseaError
  }

  return errors
}
