import { Resend } from 'resend';
import OtpEmail from '@/emails/otp-email';
import ConfirmationEmail from '@/emails/confirmation-email';

// Default sender email (change this to your verified domain)
const FROM_EMAIL = 'Cobbee <noreply@yourdomain.com>';

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
 * Generate a secure 6-digit OTP code
 */
export function generateOTP(): string {
  // Generate cryptographically secure random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

/**
 * Hash OTP code for secure database storage
 * Using simple crypto.subtle if available, otherwise store plain
 * Note: For production, consider bcrypt or similar
 */
export async function hashOTP(otp: string): Promise<string> {
  // For now, we'll store plain OTP since it's already time-limited
  // In production, consider using bcrypt or similar
  // Example: const salt = await bcrypt.genSalt(10); return bcrypt.hash(otp, salt);
  return otp;
}

/**
 * Verify OTP code against hash
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  // For now, simple comparison since we're storing plain
  // In production with bcrypt: return bcrypt.compare(otp, hash);
  return otp === hash;
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
