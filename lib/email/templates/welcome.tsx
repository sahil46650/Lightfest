/**
 * Welcome Email Template
 *
 * Sent when a new user creates an account.
 * Contains:
 * - Welcome message
 * - Getting started guide
 * - Login CTA
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Button,
  Hr,
  Preview,
} from "@react-email/components"
import * as React from "react"
import { WelcomeContext, DEFAULT_EMAIL_STYLE } from "../types"

interface WelcomeEmailProps {
  context: WelcomeContext
}

export function WelcomeEmail({ context }: WelcomeEmailProps) {
  const { userName, userEmail, loginUrl, supportEmail } = context

  const previewText = "Welcome to Festival Lights!"
  const firstName = userName.split(" ")[0]

  return (
    <Html lang="en">
      <Head>
        <title>Welcome to Festival Lights!</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Festival Lights</Text>
          </Section>

          {/* Welcome Banner */}
          <Section style={styles.welcomeBanner}>
            <Text style={styles.welcomeIcon}>&#127881;</Text>
            <Text style={styles.welcomeTitle}>Welcome to Festival Lights!</Text>
            <Text style={styles.welcomeSubtitle}>
              Your account has been created successfully
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={styles.section}>
            <Text style={styles.greeting}>Hi {firstName}!</Text>
            <Text style={styles.messageText}>
              Thank you for joining Festival Lights. We are thrilled to have you
              as part of our community! Get ready to discover and experience
              amazing events.
            </Text>
          </Section>

          {/* What You Can Do */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>What You Can Do</Text>
            <Container style={styles.featuresBox}>
              <Row style={styles.featureRow}>
                <Column style={styles.featureIconCol}>
                  <Text style={styles.featureIcon}>&#127915;</Text>
                </Column>
                <Column>
                  <Text style={styles.featureTitle}>Browse Events</Text>
                  <Text style={styles.featureText}>
                    Discover upcoming festivals, concerts, and special events
                  </Text>
                </Column>
              </Row>
              <Row style={styles.featureRow}>
                <Column style={styles.featureIconCol}>
                  <Text style={styles.featureIcon}>&#128176;</Text>
                </Column>
                <Column>
                  <Text style={styles.featureTitle}>Book Tickets</Text>
                  <Text style={styles.featureText}>
                    Secure your spot with easy online booking
                  </Text>
                </Column>
              </Row>
              <Row style={styles.featureRow}>
                <Column style={styles.featureIconCol}>
                  <Text style={styles.featureIcon}>&#128241;</Text>
                </Column>
                <Column>
                  <Text style={styles.featureTitle}>Mobile Tickets</Text>
                  <Text style={styles.featureText}>
                    Access your tickets anytime on your phone
                  </Text>
                </Column>
              </Row>
              <Row style={styles.featureRow}>
                <Column style={styles.featureIconCol}>
                  <Text style={styles.featureIcon}>&#11088;</Text>
                </Column>
                <Column>
                  <Text style={styles.featureTitle}>Exclusive Offers</Text>
                  <Text style={styles.featureText}>
                    Get early access and member-only discounts
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={loginUrl}>
              Start Exploring Events
            </Button>
          </Section>

          {/* Account Info */}
          <Section style={styles.section}>
            <Container style={styles.accountBox}>
              <Text style={styles.accountTitle}>Your Account Details</Text>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{userEmail}</Text>
              <Text style={styles.accountHint}>
                Use this email to sign in to your account
              </Text>
            </Container>
          </Section>

          {/* Tips */}
          <Section style={styles.section}>
            <Text style={styles.tipsTitle}>&#128161; Quick Tips</Text>
            <Container style={styles.tipsList}>
              <Text style={styles.tipItem}>
                &#8226; Add your phone number for SMS reminders
              </Text>
              <Text style={styles.tipItem}>
                &#8226; Turn on notifications to never miss an event
              </Text>
              <Text style={styles.tipItem}>
                &#8226; Follow your favorite venues for updates
              </Text>
            </Container>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Have questions? We are here to help!{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.footerLink}>
                Contact Support
              </Link>
            </Text>
            <Hr style={styles.footerDivider} />
            <Text style={styles.footerSmall}>
              This email was sent to {userEmail} because you created an account
              on Festival Lights.
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
  welcomeBanner: {
    backgroundColor: "#ecfdf5",
    padding: "32px",
    textAlign: "center" as const,
    borderBottom: "4px solid #10b981",
  },
  welcomeIcon: {
    fontSize: "64px",
    margin: "0 0 8px 0",
    lineHeight: 1,
  },
  welcomeTitle: {
    color: "#065f46",
    fontSize: "28px",
    fontWeight: "bold" as const,
    margin: "0 0 4px 0",
  },
  welcomeSubtitle: {
    color: "#047857",
    fontSize: "16px",
    margin: 0,
  },
  section: {
    padding: "24px 32px",
  },
  greeting: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "20px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
  },
  messageText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    lineHeight: 1.6,
    margin: 0,
  },
  sectionTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
  },
  featuresBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  featureRow: {
    padding: "12px 0",
    borderBottom: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  featureIconCol: {
    width: "48px",
    verticalAlign: "top" as const,
  },
  featureIcon: {
    fontSize: "24px",
    margin: 0,
  },
  featureTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    fontWeight: "bold" as const,
    margin: "0 0 4px 0",
  },
  featureText: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "13px",
    margin: 0,
  },
  ctaSection: {
    padding: "0 32px 32px 32px",
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
  accountBox: {
    backgroundColor: "#faf5ff",
    borderRadius: "8px",
    padding: "20px",
    border: `1px solid ${DEFAULT_EMAIL_STYLE.primaryColor}`,
    textAlign: "center" as const,
  },
  accountTitle: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "14px",
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "0 0 12px 0",
  },
  accountLabel: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "12px",
    textTransform: "uppercase" as const,
    margin: "0 0 4px 0",
  },
  accountValue: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: "0 0 8px 0",
  },
  accountHint: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "12px",
    margin: 0,
  },
  tipsTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  tipsList: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  tipItem: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "13px",
    lineHeight: 1.6,
    margin: "0 0 6px 0",
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

export default WelcomeEmail
