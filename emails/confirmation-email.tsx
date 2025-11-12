import * as React from 'react';

interface ConfirmationEmailProps {
  confirmationLink: string;
  currentEmail?: string;
  newEmail: string;
}

export const ConfirmationEmail: React.FC<Readonly<ConfirmationEmailProps>> = ({
  confirmationLink,
  currentEmail,
  newEmail,
}) => {
  const isChangingEmail = !!currentEmail;

  return (
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
          {isChangingEmail ? 'Confirm Email Change' : 'Verify Your Email'}
        </h2>

        {isChangingEmail && (
          <div style={{
            backgroundColor: '#FFF8E1',
            border: '4px solid #000000',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#000000',
              fontWeight: 700,
            }}>
              Current email:
            </p>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              color: '#000000',
            }}>
              {currentEmail}
            </p>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#000000',
              fontWeight: 700,
            }}>
              New email:
            </p>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: '#000000',
            }}>
              {newEmail}
            </p>
          </div>
        )}

        <p style={{
          margin: '0 0 32px 0',
          fontSize: '16px',
          lineHeight: '24px',
          color: '#000000',
          textAlign: 'center',
        }}>
          {isChangingEmail
            ? 'Click the button below to confirm your email change:'
            : 'Click the button below to verify your email address:'}
        </p>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a
            href={confirmationLink}
            style={{
              display: 'inline-block',
              backgroundColor: '#0000FF',
              color: '#CCFF00',
              fontSize: '18px',
              fontWeight: 900,
              padding: '16px 48px',
              border: '4px solid #000000',
              borderRadius: '16px',
              textDecoration: 'none',
              boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
            }}
          >
            {isChangingEmail ? 'Confirm Email Change' : 'Verify Email'}
          </a>
        </div>

        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          lineHeight: '20px',
          color: '#000000',
          textAlign: 'center',
        }}>
          This link will expire in <strong>24 hours</strong>.
        </p>

        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          lineHeight: '20px',
          color: '#666666',
          textAlign: 'center',
        }}>
          Or copy and paste this link into your browser:
        </p>

        <div style={{
          backgroundColor: '#F5F5F5',
          border: '2px solid #000000',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px',
          wordBreak: 'break-all',
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#000000',
            fontFamily: 'monospace',
          }}>
            {confirmationLink}
          </p>
        </div>

        <p style={{
          margin: '0',
          fontSize: '14px',
          lineHeight: '20px',
          color: '#666666',
          textAlign: 'center',
        }}>
          If you didn't request this {isChangingEmail ? 'change' : 'verification'}, you can safely ignore this email.
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
};

export default ConfirmationEmail;
