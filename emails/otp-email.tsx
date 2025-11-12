import * as React from 'react';

interface OtpEmailProps {
  otpCode: string;
}

export const OtpEmail: React.FC<Readonly<OtpEmailProps>> = ({ otpCode }) => (
  <div style={{
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
  }}>
    {/* Header */}
    <div style={{
      backgroundColor: '#CCFF00',
      padding: '32px',
      border: '4px solid #000000',
      borderBottom: 'none',
      textAlign: 'center',
    }}>
      <h1 style={{
        margin: 0,
        fontSize: '32px',
        fontWeight: 900,
        color: '#000000',
        letterSpacing: '-0.02em',
      }}>
        Cobbee
      </h1>
    </div>

    {/* Content */}
    <div style={{
      backgroundColor: '#ffffff',
      padding: '48px 32px',
      border: '4px solid #000000',
      borderTop: 'none',
      borderBottom: 'none',
    }}>
      <h2 style={{
        margin: '0 0 24px 0',
        fontSize: '28px',
        fontWeight: 900,
        color: '#000000',
        textAlign: 'center',
      }}>
        Verify Your Email
      </h2>

      <p style={{
        margin: '0 0 32px 0',
        fontSize: '16px',
        lineHeight: '24px',
        color: '#000000',
        textAlign: 'center',
      }}>
        Enter this verification code to add your email address to Cobbee:
      </p>

      {/* OTP Code Box */}
      <div style={{
        backgroundColor: '#0000FF',
        border: '4px solid #000000',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
        marginBottom: '32px',
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#CCFF00',
          letterSpacing: '8px',
          fontFamily: 'monospace',
        }}>
          {otpCode}
        </div>
      </div>

      <p style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        lineHeight: '20px',
        color: '#000000',
        textAlign: 'center',
      }}>
        This code will expire in <strong>10 minutes</strong>.
      </p>

      <p style={{
        margin: '0',
        fontSize: '14px',
        lineHeight: '20px',
        color: '#666666',
        textAlign: 'center',
      }}>
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>

    {/* Footer */}
    <div style={{
      backgroundColor: '#000000',
      padding: '32px',
      border: '4px solid #000000',
      textAlign: 'center',
    }}>
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        color: '#CCFF00',
        fontWeight: 700,
      }}>
        Cobbee
      </p>
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: '#CCFF00',
      }}>
        Support your favorite creators with coffee
      </p>
    </div>
  </div>
);

export default OtpEmail;
