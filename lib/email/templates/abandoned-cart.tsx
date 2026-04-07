/**
 * Abandoned Cart Email Template
 *
 * Sent 1 hour after a draft booking is created without completion.
 * Contains:
 * - "You left items in your cart" message
 * - Event and cart details
 * - Incentive promo code
 * - Resume checkout CTA
 * - Urgency messaging
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
import { AbandonedCartContext, DEFAULT_EMAIL_STYLE } from "../types"

interface AbandonedCartEmailProps {
  context: AbandonedCartContext
}

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function AbandonedCartEmail({ context }: AbandonedCartEmailProps) {
  const {
    customerName,
    eventName,
    eventDate,
    eventTime,
    cartItems,
    cartTotal,
    resumeUrl,
    promoCode,
    promoDiscount,
    expiresAt,
    supportEmail,
  } = context

  const previewText = `Don't miss out! Complete your ${eventName} booking`
  const greeting = customerName ? `Hi ${customerName.split(" ")[0]}` : "Hi there"

  return (
    <Html lang="en">
      <Head>
        <title>Complete Your Booking - {eventName}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Festival Lights</Text>
          </Section>

          {/* Cart Reminder Banner */}
          <Section style={styles.reminderBanner}>
            <Text style={styles.cartIcon}>&#128722;</Text>
            <Text style={styles.reminderTitle}>You left something behind!</Text>
            <Text style={styles.reminderSubtitle}>
              Your {eventName} tickets are waiting for you
            </Text>
          </Section>

          {/* Greeting */}
          <Section style={styles.section}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.messageText}>
              We noticed you were in the middle of booking tickets for{" "}
              <strong>{eventName}</strong> but did not complete your purchase.
              No worries - we have saved your cart for you!
            </Text>
          </Section>

          {/* Event Info */}
          <Section style={styles.section}>
            <Container style={styles.eventCard}>
              <Text style={styles.eventName}>{eventName}</Text>
              <Row>
                <Column style={styles.eventDetailCol}>
                  <Text style={styles.eventIcon}>&#128197;</Text>
                  <Text style={styles.eventValue}>{eventDate}</Text>
                </Column>
                <Column style={styles.eventDetailCol}>
                  <Text style={styles.eventIcon}>&#128337;</Text>
                  <Text style={styles.eventValue}>{eventTime}</Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Cart Contents */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Your Cart</Text>
            <Container style={styles.cartBox}>
              {cartItems.map((item, index) => (
                <Row key={index} style={styles.cartItemRow}>
                  <Column style={styles.cartItemName}>
                    <Text style={styles.cartItemText}>
                      {item.ticketType} x {item.quantity}
                    </Text>
                  </Column>
                  <Column style={styles.cartItemPrice}>
                    <Text style={styles.cartItemPriceText}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                  </Column>
                </Row>
              ))}
              <Hr style={styles.cartDivider} />
              <Row>
                <Column>
                  <Text style={styles.cartTotalLabel}>Cart Total</Text>
                </Column>
                <Column>
                  <Text style={styles.cartTotalValue}>
                    {formatCurrency(cartTotal)}
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Promo Code Incentive */}
          {promoCode && promoDiscount && (
            <Section style={styles.promoSection}>
              <Container style={styles.promoBox}>
                <Text style={styles.promoTitle}>&#127881; Special Offer!</Text>
                <Text style={styles.promoText}>
                  Complete your booking today and get{" "}
                  <strong>{promoDiscount}% off</strong> with code:
                </Text>
                <Text style={styles.promoCode}>{promoCode}</Text>
                <Text style={styles.promoHint}>
                  Enter this code at checkout to save
                </Text>
              </Container>
            </Section>
          )}

          {/* Urgency Message */}
          <Section style={styles.urgencySection}>
            <Container style={styles.urgencyBox}>
              <Text style={styles.urgencyIcon}>&#9200;</Text>
              <Text style={styles.urgencyText}>
                Your cart will expire <strong>{expiresAt}</strong>
              </Text>
              <Text style={styles.urgencySubtext}>
                Tickets are selling fast - complete your booking to secure your
                spot!
              </Text>
            </Container>
          </Section>

          {/* CTA Button */}
          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={resumeUrl}>
              Complete My Booking
            </Button>
            <Text style={styles.ctaSubtext}>
              Pick up right where you left off
            </Text>
          </Section>

          {/* Why Complete Section */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitleSmall}>
              Why Complete Your Booking?
            </Text>
            <Container style={styles.benefitsList}>
              <Row style={styles.benefitRow}>
                <Column style={styles.benefitIcon}>
                  <Text style={styles.checkIcon}>&#10003;</Text>
                </Column>
                <Column>
                  <Text style={styles.benefitText}>
                    <strong>Instant confirmation</strong> - Receive your tickets
                    immediately
                  </Text>
                </Column>
              </Row>
              <Row style={styles.benefitRow}>
                <Column style={styles.benefitIcon}>
                  <Text style={styles.checkIcon}>&#10003;</Text>
                </Column>
                <Column>
                  <Text style={styles.benefitText}>
                    <strong>Mobile tickets</strong> - Easy entry with QR codes
                  </Text>
                </Column>
              </Row>
              <Row style={styles.benefitRow}>
                <Column style={styles.benefitIcon}>
                  <Text style={styles.checkIcon}>&#10003;</Text>
                </Column>
                <Column>
                  <Text style={styles.benefitText}>
                    <strong>Secure checkout</strong> - Your payment info is
                    protected
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Changed your mind? No problem - just ignore this email and your
              cart will expire automatically.
            </Text>
            <Hr style={styles.footerDivider} />
            <Text style={styles.footerText}>
              Need help? Contact us at{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.footerLink}>
                {supportEmail}
              </Link>
            </Text>
            <Text style={styles.footerSmall}>
              &copy; {new Date().getFullYear()} Festival Lights. All rights
              reserved.
            </Text>
            <Text style={styles.unsubscribe}>
              You received this email because you started a booking on Festival
              Lights.
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
  reminderBanner: {
    backgroundColor: "#fef2f2",
    padding: "24px 32px",
    textAlign: "center" as const,
    borderBottom: "3px solid #ef4444",
  },
  cartIcon: {
    fontSize: "48px",
    margin: "0 0 8px 0",
    lineHeight: 1,
  },
  reminderTitle: {
    color: "#991b1b",
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0 0 4px 0",
  },
  reminderSubtitle: {
    color: "#dc2626",
    fontSize: "16px",
    margin: 0,
  },
  section: {
    padding: "24px 32px",
  },
  greeting: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  messageText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    lineHeight: 1.6,
    margin: 0,
  },
  eventCard: {
    backgroundColor: "#faf5ff",
    borderRadius: "10px",
    padding: "20px",
    textAlign: "center" as const,
    border: `1px solid ${DEFAULT_EMAIL_STYLE.primaryColor}`,
  },
  eventName: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "20px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
  },
  eventDetailCol: {
    width: "50%",
    textAlign: "center" as const,
  },
  eventIcon: {
    fontSize: "20px",
    margin: "0 0 4px 0",
  },
  eventValue: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    fontWeight: "500" as const,
    margin: 0,
  },
  sectionTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  sectionTitleSmall: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: "0 0 12px 0",
  },
  cartBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  cartItemRow: {
    padding: "8px 0",
  },
  cartItemName: {
    width: "70%",
  },
  cartItemText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    margin: 0,
  },
  cartItemPrice: {
    width: "30%",
    textAlign: "right" as const,
  },
  cartItemPriceText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    margin: 0,
  },
  cartDivider: {
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    margin: "12px 0",
  },
  cartTotalLabel: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: 0,
  },
  cartTotalValue: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "20px",
    fontWeight: "bold" as const,
    textAlign: "right" as const,
    margin: 0,
  },
  promoSection: {
    padding: "0 32px 24px 32px",
  },
  promoBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: "10px",
    padding: "20px",
    textAlign: "center" as const,
    border: "2px dashed #10b981",
  },
  promoTitle: {
    color: "#065f46",
    fontSize: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 8px 0",
  },
  promoText: {
    color: "#047857",
    fontSize: "14px",
    margin: "0 0 12px 0",
  },
  promoCode: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold" as const,
    padding: "10px 24px",
    borderRadius: "6px",
    display: "inline-block" as const,
    letterSpacing: "2px",
    fontFamily: "monospace",
    margin: "0 0 8px 0",
  },
  promoHint: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "12px",
    margin: 0,
  },
  urgencySection: {
    padding: "0 32px 24px 32px",
  },
  urgencyBox: {
    backgroundColor: "#fffbeb",
    borderRadius: "8px",
    padding: "16px 20px",
    textAlign: "center" as const,
    border: "1px solid #fcd34d",
  },
  urgencyIcon: {
    fontSize: "24px",
    margin: "0 0 4px 0",
  },
  urgencyText: {
    color: "#92400e",
    fontSize: "15px",
    margin: "0 0 4px 0",
  },
  urgencySubtext: {
    color: "#b45309",
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
  ctaSubtext: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "13px",
    margin: "12px 0 0 0",
  },
  benefitsList: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  benefitRow: {
    padding: "8px 0",
  },
  benefitIcon: {
    width: "28px",
    verticalAlign: "top" as const,
  },
  checkIcon: {
    color: "#10b981",
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: 0,
  },
  benefitText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    margin: 0,
    lineHeight: 1.4,
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
    margin: "12px 0 0 0",
  },
  unsubscribe: {
    color: "#9ca3af",
    fontSize: "11px",
    margin: "8px 0 0 0",
    fontStyle: "italic" as const,
  },
}

export default AbandonedCartEmail
