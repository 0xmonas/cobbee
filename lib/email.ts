import { Resend } from 'resend';
import OtpEmail from '@/emails/otp-email';
import ConfirmationEmail from '@/emails/confirmation-email';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'crypto';

// Default sender email (verified Resend domain)
const FROM_EMAIL = 'Cobbee <noreply@mail.cobbee.fun>';

/**
 * Get Resend client instance (lazy initialization)
 * This avoids build-time errors when RESEND_API_KEY is not set
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set. Email functionality requires a valid Resend API key.');
  }

  return new Resend(apiKey);
}

/**
 * Generate a cryptographically secure 6-digit OTP code
 *
 * Security Standards:
 * - NIST SP 800-63B: Recommends 6+ digits for OTP
 * - OWASP ASVS: Requires cryptographically secure random generation
 * - Uses crypto.randomBytes for true randomness (not Math.random)
 *
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  // Generate cryptographically secure random bytes
  // Using crypto.randomBytes instead of Math.random (OWASP requirement)
  const buffer = randomBytes(4); // 4 bytes = 32 bits of entropy
  const randomNumber = buffer.readUInt32BE(0);

  // Convert to 6-digit number (100000 to 999999)
  const otp = (randomNumber % 900000) + 100000;

  return otp.toString();
}

/**
 * Get OTP expiry time
 *
 * Security Standards:
 * - NIST SP 800-63B: Recommends 5-10 minutes
 * - OWASP: Max 10 minutes to prevent brute force
 * - Industry standard: 5 minutes for high-security, 10 for convenience
 *
 * @returns Date object 5 minutes from now
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  // Changed from 10 to 5 minutes (NIST recommendation for high-security)
  expiry.setMinutes(expiry.getMinutes() + 5);
  return expiry;
}

/**
 * Hash OTP code for secure database storage using Argon2id
 *
 * Security Standards:
 * - OWASP Password Storage Cheat Sheet: Recommends Argon2id
 * - Password Hashing Competition (PHC) 2015 Winner: Argon2
 * - RFC 9106: Argon2 Memory-Hard Function
 * - NIST: Approved for password hashing
 *
 * Why Argon2id?
 * 1. Winner of Password Hashing Competition (2015)
 * 2. Resistant to GPU/ASIC attacks (memory-hard)
 * 3. Resistant to side-channel attacks
 * 4. Configurable memory cost, time cost, parallelism
 * 5. OWASP #1 recommendation for password/token hashing
 *
 * Configuration (OWASP recommendations):
 * - Memory cost: 19 MiB (19456 KiB) - balance between security and performance
 * - Time cost: 2 iterations - good balance
 * - Parallelism: 1 - sufficient for our use case
 * - Hash length: 32 bytes - standard secure length
 *
 * @param otp - Plain text OTP code
 * @returns Argon2id hash with embedded salt and parameters
 */
export async function hashOTP(otp: string): Promise<string> {
  try {
    // Argon2id configuration based on OWASP recommendations
    const argon2Hash = await hash(otp, {
      memoryCost: 19456,      // 19 MiB (OWASP minimum for server-side)
      timeCost: 2,            // 2 iterations (OWASP recommendation)
      parallelism: 1,         // Single thread (sufficient for OTP)
      outputLen: 32,          // 32 bytes output
    });

    return argon2Hash;
  } catch (error) {
    console.error('Argon2 hashing error:', error);
    throw new Error('Failed to hash OTP code');
  }
}

/**
 * Verify OTP code against Argon2id hash
 *
 * Timing-Attack Resistant:
 * - Argon2 verify() uses constant-time comparison
 * - Prevents timing attacks that could leak information
 *
 * @param otp - Plain text OTP to verify
 * @param hash - Argon2id hash from database
 * @returns true if OTP matches, false otherwise
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  try {
    // Argon2 verify automatically handles constant-time comparison
    // This prevents timing attacks (OWASP security requirement)
    return await verify(hash, otp);
  } catch (error) {
    console.error('Argon2 verification error:', error);
    // On error, return false (fail closed, not fail open)
    return false;
  }
}

/**
 * Send OTP email for email verification
 */
export async function sendOtpEmail(email: string, otpCode: string) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Verify Your Email - Cobbee',
      react: OtpEmail({ otpCode }) as React.ReactElement,
    });

    if (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send OTP email error:', error);
    throw error;
  }
}

/**
 * Send confirmation email for email change
 */
export async function sendConfirmationEmail(
  email: string,
  confirmationLink: string,
  currentEmail?: string
) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: currentEmail
        ? 'Confirm Your Email Change - Cobbee'
        : 'Verify Your Email - Cobbee',
      react: ConfirmationEmail({
        confirmationLink,
        currentEmail,
        newEmail: email,
      }) as React.ReactElement,
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send confirmation email error:', error);
    throw error;
  }
}

/**
 * Send security notification to current email when email is being changed
 */
export async function sendSecurityNotification(currentEmail: string, newEmail: string) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [currentEmail],
      subject: 'Security Alert: Email Change Request - Cobbee',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #CCFF00; padding: 32px; border: 4px solid #000000; text-align: center;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #000000;">Cobbee</h1>
          </div>
          <div style="background-color: #ffffff; padding: 48px 32px; border: 4px solid #000000; border-top: none;">
            <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 900; color: #000000;">Security Alert</h2>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #000000;">
              We detected a request to change your email address from:
            </p>
            <div style="background-color: #F5F5F5; border: 2px solid #000000; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #000000; font-weight: 700;">Current email:</p>
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #000000;">${currentEmail}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #000000; font-weight: 700;">New email:</p>
              <p style="margin: 0; font-size: 16px; color: #000000;">${newEmail}</p>
            </div>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #000000;">
              A confirmation link has been sent to <strong>${newEmail}</strong>.
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 20px; color: #666666;">
              If you didn't make this request, please secure your account immediately by changing your password.
            </p>
          </div>
          <div style="background-color: #000000; padding: 32px; border: 4px solid #000000; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #CCFF00; font-weight: 700;">Cobbee</p>
            <p style="margin: 0; font-size: 12px; color: #CCFF00;">Support your favorite creators with coffee</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send security notification:', error);
      // Don't throw error for security notification - it's not critical
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Send security notification error:', error);
    // Don't throw error for security notification - it's not critical
    return { success: false, error };
  }
}
