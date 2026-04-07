/**
 * Booking Confirmation Email Template
 *
 * Sent immediately after a booking is confirmed.
 * Contains:
 * - Confirmation number (highlighted)
 * - Event details
 * - Ticket breakdown table
 * - Attendee list
 * - Pricing summary
 * - QR codes for each ticket
 * - Call-to-action buttons
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
  Img,
  Hr,
  Preview,
} from "@react-email/components"
import * as React from "react"
import { BookingConfirmationContext, DEFAULT_EMAIL_STYLE } from "../types"

interface BookingConfirmationEmailProps {
  context: BookingConfirmationContext
}

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function BookingConfirmationEmail({
  context,
}: BookingConfirmationEmailProps) {
  const {
    customerName,
    customerFirstName,
    confirmationNumber,
    eventName,
    eventDate,
    eventTime,
    eventTimezone,
    location,
    address,
    tickets,
    attendees,
    subtotal,
    serviceFee,
    serviceFeeRate,
    discount,
    promoCode,
    total,
    qrCodes,
    bookingUrl,
    addToCalendarUrl,
    supportEmail,
  } = context

  const previewText = `Your tickets for ${eventName} - Confirmation #${confirmationNumber}`

  return (
    <Html lang="en">
      <Head>
        <title>Booking Confirmed - {eventName}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Festival Lights</Text>
            <Text style={styles.headerSubtitle}>Booking Confirmation</Text>
          </Section>

          {/* Success Banner */}
          <Section style={styles.successBanner}>
            <Text style={styles.successIcon}>&#x2713;</Text>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              Thank you, {customerFirstName}! Your tickets are ready.
            </Text>
          </Section>

          {/* Confirmation Number Box */}
          <Section style={styles.confirmationBox}>
            <Text style={styles.confirmationLabel}>Confirmation Number</Text>
            <Text style={styles.confirmationNumber}>{confirmationNumber}</Text>
            <Text style={styles.confirmationHint}>
              Save this number for your records
            </Text>
          </Section>

          {/* Event Details */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>
            <Container style={styles.eventCard}>
              <Text style={styles.eventName}>{eventName}</Text>
              <Row>
                <Column style={styles.eventDetailColumn}>
                  <Text style={styles.eventLabel}>Date</Text>
                  <Text style={styles.eventValue}>{eventDate}</Text>
                </Column>
                <Column style={styles.eventDetailColumn}>
                  <Text style={styles.eventLabel}>Time</Text>
                  <Text style={styles.eventValue}>
                    {eventTime} ({eventTimezone})
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text style={styles.eventLabel}>Location</Text>
                  <Text style={styles.eventValue}>{location}</Text>
                  {address && (
                    <Text style={styles.eventAddress}>{address}</Text>
                  )}
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Tickets Table */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Your Tickets</Text>
            <Container style={styles.table}>
              {/* Table Header */}
              <Row style={styles.tableHeader}>
                <Column style={styles.tableColTicket}>
                  <Text style={styles.tableHeaderText}>Ticket Type</Text>
                </Column>
                <Column style={styles.tableColQty}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </Column>
                <Column style={styles.tableColPrice}>
                  <Text style={styles.tableHeaderText}>Price</Text>
                </Column>
                <Column style={styles.tableColSubtotal}>
                  <Text style={styles.tableHeaderText}>Subtotal</Text>
                </Column>
              </Row>

              {/* Ticket Rows */}
              {tickets.map((ticket, index) => (
                <Row
                  key={index}
                  style={
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                  }
                >
                  <Column style={styles.tableColTicket}>
                    <Text style={styles.tableCellText}>{ticket.ticketType}</Text>
                  </Column>
                  <Column style={styles.tableColQty}>
                    <Text style={styles.tableCellTextCenter}>
                      {ticket.quantity}
                    </Text>
                  </Column>
                  <Column style={styles.tableColPrice}>
                    <Text style={styles.tableCellTextRight}>
                      {formatCurrency(ticket.unitPrice)}
                    </Text>
                  </Column>
                  <Column style={styles.tableColSubtotal}>
                    <Text style={styles.tableCellTextRight}>
                      {formatCurrency(ticket.subtotal)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Container>
          </Section>

          {/* Attendees */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Attendees</Text>
            <Container style={styles.attendeeList}>
              {attendees.map((attendee, index) => (
                <Row key={index} style={styles.attendeeRow}>
                  <Column style={styles.attendeeNumber}>
                    <Text style={styles.attendeeNumberText}>{index + 1}</Text>
                  </Column>
                  <Column style={styles.attendeeDetails}>
                    <Text style={styles.attendeeName}>{attendee.name}</Text>
                    <Text style={styles.attendeeEmail}>{attendee.email}</Text>
                    <Text style={styles.attendeeTicketType}>
                      {attendee.ticketType}
                    </Text>
                    {attendee.addOns && attendee.addOns.length > 0 && (
                      <Text style={styles.attendeeAddOns}>
                        Add-ons:{" "}
                        {attendee.addOns
                          .map((a) => `${a.name} (${formatCurrency(a.price)})`)
                          .join(", ")}
                      </Text>
                    )}
                  </Column>
                </Row>
              ))}
            </Container>
          </Section>

          {/* Pricing Summary */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <Container style={styles.pricingSummary}>
              <Row style={styles.pricingRow}>
                <Column>
                  <Text style={styles.pricingLabel}>Subtotal</Text>
                </Column>
                <Column>
                  <Text style={styles.pricingValue}>
                    {formatCurrency(subtotal)}
                  </Text>
                </Column>
              </Row>
              <Row style={styles.pricingRow}>
                <Column>
                  <Text style={styles.pricingLabel}>
                    Service Fee ({Math.round(serviceFeeRate * 100)}%)
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.pricingValue}>
                    {formatCurrency(serviceFee)}
                  </Text>
                </Column>
              </Row>
              {discount > 0 && (
                <Row style={styles.pricingRow}>
                  <Column>
                    <Text style={styles.pricingLabelDiscount}>
                      Discount {promoCode && `(${promoCode})`}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={styles.pricingValueDiscount}>
                      -{formatCurrency(discount)}
                    </Text>
                  </Column>
                </Row>
              )}
              <Hr style={styles.pricingDivider} />
              <Row style={styles.pricingRowTotal}>
                <Column>
                  <Text style={styles.pricingLabelTotal}>Total Paid</Text>
                </Column>
                <Column>
                  <Text style={styles.pricingValueTotal}>
                    {formatCurrency(total)}
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* QR Codes */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Your Ticket QR Codes</Text>
            <Text style={styles.qrHint}>
              Present these QR codes at the event entrance for entry
            </Text>
            <Container style={styles.qrGrid}>
              {qrCodes.map((qr, index) => (
                <Container key={index} style={styles.qrItem}>
                  <Img
                    src={qr.qrCodeDataUrl}
                    alt={`Ticket QR Code ${index + 1}`}
                    width={120}
                    height={120}
                    style={styles.qrImage}
                  />
                  <Text style={styles.qrLabel}>{qr.attendeeName}</Text>
                  <Text style={styles.qrTicketType}>{qr.ticketType}</Text>
                </Container>
              ))}
            </Container>
          </Section>

          {/* CTA Buttons */}
          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButtonPrimary} href={bookingUrl}>
              View Booking Details
            </Button>
            {addToCalendarUrl && (
              <Button style={styles.ctaButtonSecondary} href={addToCalendarUrl}>
                Add to Calendar
              </Button>
            )}
          </Section>

          {/* Event Reminder */}
          <Section style={styles.reminderBox}>
            <Text style={styles.reminderTitle}>Event Reminder</Text>
            <Text style={styles.reminderText}>
              {eventName} on {eventDate} at {eventTime}
            </Text>
            <Text style={styles.reminderText}>
              {location}
              {address && `, ${address}`}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Questions? Email us at{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.footerLink}>
                {supportEmail}
              </Link>
            </Text>
            <Text style={styles.footerText}>
              <Link href={bookingUrl} style={styles.footerLink}>
                View this email in your browser
              </Link>
            </Text>
            <Hr style={styles.footerDivider} />
            <Text style={styles.footerSmall}>
              This email was sent to {attendees[0]?.email || customerName} because you
              made a booking at Festival Lights.
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
    padding: "24px 32px",
    textAlign: "center" as const,
  },
  logo: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "bold" as const,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  successBanner: {
    backgroundColor: "#ecfdf5",
    padding: "24px 32px",
    textAlign: "center" as const,
    borderBottom: "4px solid #10b981",
  },
  successIcon: {
    color: "#10b981",
    fontSize: "48px",
    margin: "0 0 8px 0",
    lineHeight: 1,
  },
  successTitle: {
    color: "#065f46",
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0 0 4px 0",
  },
  successSubtitle: {
    color: "#047857",
    fontSize: "16px",
    margin: 0,
  },
  confirmationBox: {
    backgroundColor: "#fef3c7",
    padding: "20px 32px",
    textAlign: "center" as const,
    margin: "0",
  },
  confirmationLabel: {
    color: "#92400e",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "0 0 8px 0",
  },
  confirmationNumber: {
    color: "#78350f",
    fontSize: "32px",
    fontWeight: "bold" as const,
    fontFamily: "monospace",
    margin: "0 0 8px 0",
    letterSpacing: "2px",
  },
  confirmationHint: {
    color: "#92400e",
    fontSize: "12px",
    margin: 0,
  },
  section: {
    padding: "24px 32px",
  },
  sectionTitle: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "18px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
    borderBottom: `2px solid ${DEFAULT_EMAIL_STYLE.primaryColor}`,
    paddingBottom: "8px",
  },
  eventCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  eventName: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "20px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
  },
  eventDetailColumn: {
    width: "50%",
    paddingRight: "16px",
    paddingBottom: "12px",
  },
  eventLabel: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px 0",
  },
  eventValue: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    fontWeight: "500" as const,
    margin: 0,
  },
  eventAddress: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableHeader: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    padding: "12px 8px",
    margin: 0,
  },
  tableColTicket: {
    width: "40%",
  },
  tableColQty: {
    width: "15%",
    textAlign: "center" as const,
  },
  tableColPrice: {
    width: "20%",
    textAlign: "right" as const,
  },
  tableColSubtotal: {
    width: "25%",
    textAlign: "right" as const,
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f9fafb",
  },
  tableCellText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    padding: "12px 8px",
    margin: 0,
  },
  tableCellTextCenter: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    padding: "12px 8px",
    margin: 0,
    textAlign: "center" as const,
  },
  tableCellTextRight: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    padding: "12px 8px",
    margin: 0,
    textAlign: "right" as const,
  },
  attendeeList: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
  },
  attendeeRow: {
    padding: "12px 0",
    borderBottom: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  attendeeNumber: {
    width: "40px",
    verticalAlign: "top" as const,
  },
  attendeeNumberText: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "bold" as const,
    width: "28px",
    height: "28px",
    lineHeight: "28px",
    textAlign: "center" as const,
    borderRadius: "50%",
    margin: 0,
  },
  attendeeDetails: {
    verticalAlign: "top" as const,
  },
  attendeeName: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    fontWeight: "bold" as const,
    margin: "0 0 2px 0",
  },
  attendeeEmail: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "13px",
    margin: "0 0 4px 0",
  },
  attendeeTicketType: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "13px",
    margin: 0,
  },
  attendeeAddOns: {
    color: DEFAULT_EMAIL_STYLE.secondaryColor,
    fontSize: "12px",
    margin: "4px 0 0 0",
  },
  pricingSummary: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  pricingRow: {
    padding: "6px 0",
  },
  pricingRowTotal: {
    padding: "12px 0 0 0",
  },
  pricingLabel: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    margin: 0,
  },
  pricingValue: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    textAlign: "right" as const,
    margin: 0,
  },
  pricingLabelDiscount: {
    color: "#059669",
    fontSize: "14px",
    margin: 0,
  },
  pricingValueDiscount: {
    color: "#059669",
    fontSize: "14px",
    textAlign: "right" as const,
    margin: 0,
  },
  pricingDivider: {
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    margin: "12px 0",
  },
  pricingLabelTotal: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: 0,
  },
  pricingValueTotal: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "20px",
    fontWeight: "bold" as const,
    textAlign: "right" as const,
    margin: 0,
  },
  qrHint: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "14px",
    margin: "0 0 16px 0",
    textAlign: "center" as const,
  },
  qrGrid: {
    textAlign: "center" as const,
  },
  qrItem: {
    display: "inline-block" as const,
    margin: "8px",
    padding: "16px",
    backgroundColor: "#ffffff",
    border: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    borderRadius: "8px",
    textAlign: "center" as const,
    verticalAlign: "top" as const,
  },
  qrImage: {
    border: "4px solid #ffffff",
    borderRadius: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  qrLabel: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "13px",
    fontWeight: "bold" as const,
    margin: "8px 0 2px 0",
  },
  qrTicketType: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "12px",
    margin: 0,
  },
  ctaSection: {
    padding: "16px 32px 32px 32px",
    textAlign: "center" as const,
  },
  ctaButtonPrimary: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold" as const,
    padding: "14px 32px",
    borderRadius: "6px",
    textDecoration: "none" as const,
    display: "inline-block" as const,
    margin: "0 8px 12px 8px",
  },
  ctaButtonSecondary: {
    backgroundColor: "#ffffff",
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "14px",
    fontWeight: "bold" as const,
    padding: "12px 24px",
    borderRadius: "6px",
    border: `2px solid ${DEFAULT_EMAIL_STYLE.primaryColor}`,
    textDecoration: "none" as const,
    display: "inline-block" as const,
    margin: "0 8px",
  },
  reminderBox: {
    backgroundColor: "#ede9fe",
    padding: "20px 32px",
    textAlign: "center" as const,
    margin: "0 32px 24px 32px",
    borderRadius: "8px",
  },
  reminderTitle: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "14px",
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "0 0 8px 0",
  },
  reminderText: {
    color: "#5b21b6",
    fontSize: "14px",
    margin: "2px 0",
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

export default BookingConfirmationEmail
