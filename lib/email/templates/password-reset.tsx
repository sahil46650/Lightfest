/**
 * Password Reset Email Template
 *
 * Sent when a user requests a password reset.
 * Contains:
 * - Clear instruction
 * - Security notice
 * - Reset button/link
 * - Expiration warning
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from "@react-email/components"
import * as React from "react"
import { PasswordResetContext, DEFAULT_EMAIL_STYLE } from "../types"

interface PasswordResetEmailProps {
  context: PasswordResetContext
}

export function PasswordResetEmail({ context }: PasswordResetEmailProps) {
  const { userName, userEmail, resetUrl, expiresAt, supportEmail } = context

  const previewText = "Reset your Festival Lights password"
  const firstName = userName.split(" ")[0]

  return (
    <Html lang="en">
      <Head>
        <title>Reset Your Password - Festival Lights</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Festival Lights</Text>
          </Section>

          {/* Lock Icon Banner */}
          <Section style={styles.iconBanner}>
            <Text style={styles.lockIcon}>&#128274;</Text>
          </Section>

          {/* Main Content */}
          <Section style={styles.section}>
            <Text style={styles.title}>Reset Your Password</Text>

            <Text style={styles.greeting}>Hi {firstName},</Text>

            <Text style={styles.messageText}>
              We received a request to reset the password for your Festival
              Lights account associated with <strong>{userEmail}</strong>.
            </Text>

            <Text style={styles.messageText}>
              Click the button below to create a new password:
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          {/* Expiration Notice */}
          <Section style={styles.section}>
            <Container style={styles.warningBox}>
              <Text style={styles.warningIcon}>&#9200;</Text>
              <Text style={styles.warningText}>
                This link will expire <strong>{expiresAt}</strong>
              </Text>
              <Text style={styles.warningSubtext}>
                After that, you will need to request a new password reset.
              </Text>
            </Container>
          </Section>

          {/* Alternative Link */}
          <Section style={styles.section}>
            <Text style={styles.linkLabel}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={styles.linkUrl}>{resetUrl}</Text>
          </Section>

          {/* Security Notice */}
          <Section style={styles.section}>
            <Container style={styles.securityBox}>
              <Text style={styles.securityTitle}>
                &#128737; Did not request this?
              </Text>
              <Text style={styles.securityText}>
                If you did not request a password reset, you can safely ignore
                this email. Your password will remain unchanged.
              </Text>
              <Text style={styles.securityText}>
                If you are concerned about your account security, please{" "}
                <Link href={`mailto:${supportEmail}`} style={styles.securityLink}>
                  contact our support team
                </Link>
                .
              </Text>
            </Container>
          </Section>

          {/* Security Tips */}
          <Section style={styles.section}>
            <Text style={styles.tipsTitle}>Password Security Tips</Text>
            <Container style={styles.tipsList}>
              <Text style={styles.tipItem}>
                &#8226; Use at least 8 characters with a mix of letters,
                numbers, and symbols
              </Text>
              <Text style={styles.tipItem}>
                &#8226; Avoid using the same password across multiple sites
              </Text>
              <Text style={styles.tipItem}>
                &#8226; Consider using a password manager
              </Text>
              <Text style={styles.tipItem}>
                &#8226; Never share your password with anyone
              </Text>
            </Container>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Need help?{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.footerLink}>
                Contact our support team
              </Link>
            </Text>
            <Hr style={styles.footerDivider} />
            <Text style={styles.footerSmall}>
              This email was sent to {userEmail} because a password reset was
              requested for your Festival Lights account.
            </Text>
            <Text style={styles.footerSmall}>
              &copy; {new Date().getFullYear()} Festival Lights. All rights
              reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: DEFAULT_EMAIL_STYLE.fontFamily,
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    padding: "20px 32px",
    textAlign: "center" as const,
  },
  logo: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  iconBanner: {
    backgroundColor: "#f3f4f6",
    padding: "32px",
    textAlign: "center" as const,
  },
  lockIcon: {
    fontSize: "64px",
    margin: 0,
    lineHeight: 1,
  },
  section: {
    padding: "24px 32px",
  },
  title: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0 0 20px 0",
    textAlign: "center" as const,
  },
  greeting: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    margin: "0 0 16px 0",
  },
  messageText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    lineHeight: 1.6,
    margin: "0 0 16px 0",
  },
  ctaSection: {
    padding: "0 32px 24px 32px",
    textAlign: "center" as const,
  },
  ctaButton: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "bold" as const,
    padding: "16px 48px",
    borderRadius: "8px",
    textDecoration: "none" as const,
    display: "inline-block" as const,
  },
  warningBox: {
    backgroundColor: "#fffbeb",
    borderRadius: "8px",
    padding: "16px 20px",
    textAlign: "center" as const,
    border: "1px solid #fcd34d",
  },
  warningIcon: {
    fontSize: "24px",
    margin: "0 0 8px 0",
  },
  warningText: {
    color: "#92400e",
    fontSize: "14px",
    margin: "0 0 4px 0",
  },
  warningSubtext: {
    color: "#b45309",
    fontSize: "13px",
    margin: 0,
  },
  linkLabel: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "13px",
    margin: "0 0 8px 0",
  },
  linkUrl: {
    backgroundColor: "#f3f4f6",
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "12px",
    padding: "12px",
    borderRadius: "4px",
    wordBreak: "break-all" as const,
    fontFamily: "monospace",
    margin: 0,
  },
  securityBox: {
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #bae6fd",
  },
  securityTitle: {
    color: "#0369a1",
    fontSize: "15px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  securityText: {
    color: "#0c4a6e",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: "0 0 8px 0",
  },
  securityLink: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    textDecoration: "underline" as const,
  },
  tipsTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  tipsList: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  tipItem: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "13px",
    lineHeight: 1.6,
    margin: "0 0 8px 0",
  },
  footer: {
    backgroundColor: "#f9fafb",
    padding: "24px 32px",
    textAlign: "center" as const,
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  footerText: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "14px",
    margin: "4px 0",
  },
  footerLink: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    textDecoration: "underline" as const,
  },
  footerDivider: {
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    margin: "16px 0",
  },
  footerSmall: {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "4px 0",
  },
}

export default PasswordResetEmail
