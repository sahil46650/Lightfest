/**
 * Event Reminder Email Template
 *
 * Sent 24 hours before an event starts.
 * Contains:
 * - "Get ready!" message
 * - Event details with weather forecast
 * - Parking information
 * - What to bring checklist
 * - Quick links
 * - Attendee list
 * - QR codes
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
import { EventReminderContext, DEFAULT_EMAIL_STYLE } from "../types"

interface EventReminderEmailProps {
  context: EventReminderContext
}

export function EventReminderEmail({ context }: EventReminderEmailProps) {
  const {
    customerName,
    eventName,
    eventDate,
    eventTime,
    eventTimezone,
    location,
    address,
    parkingInfo,
    weatherForecast,
    attendeeCount,
    attendeeNames,
    ticketViewUrl,
    directionsUrl,
    addToCalendarUrl,
    qrCodes,
    supportEmail,
  } = context

  const previewText = `Get ready! ${eventName} is tomorrow!`

  return (
    <Html lang="en">
      <Head>
        <title>Event Reminder - {eventName}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Festival Lights</Text>
            <Text style={styles.headerSubtitle}>Event Reminder</Text>
          </Section>

          {/* Reminder Banner */}
          <Section style={styles.reminderBanner}>
            <Text style={styles.reminderIcon}>&#128276;</Text>
            <Text style={styles.reminderTitle}>Get Ready!</Text>
            <Text style={styles.reminderSubtitle}>
              Your event is <strong>tomorrow</strong>
            </Text>
          </Section>

          {/* Event Details Card */}
          <Section style={styles.section}>
            <Container style={styles.eventCard}>
              <Text style={styles.eventName}>{eventName}</Text>

              <Row style={styles.eventDetailRow}>
                <Column style={styles.eventIconCol}>
                  <Text style={styles.eventIcon}>&#128197;</Text>
                </Column>
                <Column>
                  <Text style={styles.eventLabel}>Date & Time</Text>
                  <Text style={styles.eventValue}>
                    {eventDate} at {eventTime}
                  </Text>
                  <Text style={styles.eventTimezone}>({eventTimezone})</Text>
                </Column>
              </Row>

              <Row style={styles.eventDetailRow}>
                <Column style={styles.eventIconCol}>
                  <Text style={styles.eventIcon}>&#128205;</Text>
                </Column>
                <Column>
                  <Text style={styles.eventLabel}>Location</Text>
                  <Text style={styles.eventValue}>{location}</Text>
                  {address && (
                    <Text style={styles.eventAddress}>{address}</Text>
                  )}
                </Column>
              </Row>

              {weatherForecast && (
                <Row style={styles.eventDetailRow}>
                  <Column style={styles.eventIconCol}>
                    <Text style={styles.eventIcon}>&#9728;</Text>
                  </Column>
                  <Column>
                    <Text style={styles.eventLabel}>Weather Forecast</Text>
                    <Text style={styles.eventValue}>{weatherForecast}</Text>
                  </Column>
                </Row>
              )}
            </Container>
          </Section>

          {/* Parking Information */}
          {parkingInfo && (
            <Section style={styles.section}>
              <Text style={styles.sectionTitle}>&#128663; Parking Information</Text>
              <Container style={styles.infoBox}>
                <Text style={styles.infoText}>{parkingInfo}</Text>
              </Container>
            </Section>
          )}

          {/* What to Bring Checklist */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>&#9745; What to Bring</Text>
            <Container style={styles.checklistBox}>
              <Row style={styles.checklistItem}>
                <Column style={styles.checkboxCol}>
                  <Text style={styles.checkbox}>&#9744;</Text>
                </Column>
                <Column>
                  <Text style={styles.checklistText}>
                    <strong>Your tickets</strong> - QR codes are below
                  </Text>
                </Column>
              </Row>
              <Row style={styles.checklistItem}>
                <Column style={styles.checkboxCol}>
                  <Text style={styles.checkbox}>&#9744;</Text>
                </Column>
                <Column>
                  <Text style={styles.checklistText}>Valid photo ID</Text>
                </Column>
              </Row>
              <Row style={styles.checklistItem}>
                <Column style={styles.checkboxCol}>
                  <Text style={styles.checkbox}>&#9744;</Text>
                </Column>
                <Column>
                  <Text style={styles.checklistText}>
                    Cash for parking and refreshments
                  </Text>
                </Column>
              </Row>
              <Row style={styles.checklistItem}>
                <Column style={styles.checkboxCol}>
                  <Text style={styles.checkbox}>&#9744;</Text>
                </Column>
                <Column>
                  <Text style={styles.checklistText}>
                    Sunscreen / umbrella (depending on weather)
                  </Text>
                </Column>
              </Row>
              <Row style={styles.checklistItem}>
                <Column style={styles.checkboxCol}>
                  <Text style={styles.checkbox}>&#9744;</Text>
                </Column>
                <Column>
                  <Text style={styles.checklistText}>
                    Comfortable shoes for walking
                  </Text>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Quick Links */}
          <Section style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>&#128279; Quick Links</Text>
            <Container style={styles.quickLinksContainer}>
              <Row>
                <Column style={styles.quickLinkCol}>
                  {directionsUrl && (
                    <Link href={directionsUrl} style={styles.quickLink}>
                      <Text style={styles.quickLinkIcon}>&#128506;</Text>
                      <Text style={styles.quickLinkText}>Get Directions</Text>
                    </Link>
                  )}
                </Column>
                <Column style={styles.quickLinkCol}>
                  <Link href={ticketViewUrl} style={styles.quickLink}>
                    <Text style={styles.quickLinkIcon}>&#127915;</Text>
                    <Text style={styles.quickLinkText}>View Tickets</Text>
                  </Link>
                </Column>
              </Row>
              <Row>
                <Column style={styles.quickLinkCol}>
                  {addToCalendarUrl && (
                    <Link href={addToCalendarUrl} style={styles.quickLink}>
                      <Text style={styles.quickLinkIcon}>&#128197;</Text>
                      <Text style={styles.quickLinkText}>Add to Calendar</Text>
                    </Link>
                  )}
                </Column>
                <Column style={styles.quickLinkCol}>
                  <Link href={`mailto:${supportEmail}`} style={styles.quickLink}>
                    <Text style={styles.quickLinkIcon}>&#128172;</Text>
                    <Text style={styles.quickLinkText}>Contact Support</Text>
                  </Link>
                </Column>
              </Row>
            </Container>
          </Section>

          {/* Attendees */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>
              &#128101; Your Party ({attendeeCount} {attendeeCount === 1 ? "person" : "people"})
            </Text>
            <Container style={styles.attendeesList}>
              {attendeeNames.map((name, index) => (
                <Row key={index} style={styles.attendeeRow}>
                  <Column style={styles.attendeeBadge}>
                    <Text style={styles.attendeeBadgeText}>{index + 1}</Text>
                  </Column>
                  <Column>
                    <Text style={styles.attendeeName}>{name}</Text>
                  </Column>
                </Row>
              ))}
            </Container>
          </Section>

          {/* QR Codes */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>&#128273; Your Ticket QR Codes</Text>
            <Text style={styles.qrHint}>
              Save these or screenshot them - you will need them for entry!
            </Text>
            <Container style={styles.qrGrid}>
              {qrCodes.map((qr, index) => (
                <Container key={index} style={styles.qrItem}>
                  <Img
                    src={qr.qrCodeDataUrl}
                    alt={`Ticket QR Code ${index + 1}`}
                    width={100}
                    height={100}
                    style={styles.qrImage}
                  />
                  <Text style={styles.qrLabel}>{qr.attendeeName}</Text>
                </Container>
              ))}
            </Container>
          </Section>

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={ticketViewUrl}>
              View Full Booking Details
            </Button>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerExcited}>
              &#127881; We can not wait to see you tomorrow!
            </Text>
            <Hr style={styles.footerDivider} />
            <Text style={styles.footerText}>
              Questions? Email us at{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.footerLink}>
                {supportEmail}
              </Link>
            </Text>
            <Text style={styles.footerSmall}>
              &copy; {new Date().getFullYear()} Festival Lights. All rights reserved.
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
  reminderBanner: {
    backgroundColor: "#fef3c7",
    padding: "24px 32px",
    textAlign: "center" as const,
    borderBottom: "4px solid #f59e0b",
  },
  reminderIcon: {
    fontSize: "48px",
    margin: "0 0 8px 0",
    lineHeight: 1,
  },
  reminderTitle: {
    color: "#78350f",
    fontSize: "28px",
    fontWeight: "bold" as const,
    margin: "0 0 4px 0",
  },
  reminderSubtitle: {
    color: "#92400e",
    fontSize: "18px",
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
  },
  eventCard: {
    backgroundColor: "#faf5ff",
    borderRadius: "12px",
    padding: "24px",
    border: `2px solid ${DEFAULT_EMAIL_STYLE.primaryColor}`,
  },
  eventName: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "24px",
    fontWeight: "bold" as const,
    margin: "0 0 20px 0",
    textAlign: "center" as const,
  },
  eventDetailRow: {
    padding: "12px 0",
    borderTop: "1px solid #e9d5ff",
  },
  eventIconCol: {
    width: "40px",
    verticalAlign: "top" as const,
  },
  eventIcon: {
    fontSize: "20px",
    margin: 0,
    lineHeight: "24px",
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
    fontSize: "16px",
    fontWeight: "500" as const,
    margin: 0,
  },
  eventTimezone: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "13px",
    margin: "2px 0 0 0",
  },
  eventAddress: {
    color: DEFAULT_EMAIL_STYLE.mutedTextColor,
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  infoBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    padding: "16px 20px",
    border: "1px solid #86efac",
  },
  infoText: {
    color: "#166534",
    fontSize: "14px",
    margin: 0,
    lineHeight: 1.5,
  },
  checklistBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px 20px",
  },
  checklistItem: {
    padding: "8px 0",
  },
  checkboxCol: {
    width: "30px",
    verticalAlign: "top" as const,
  },
  checkbox: {
    fontSize: "16px",
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    margin: 0,
  },
  checklistText: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "14px",
    margin: 0,
    lineHeight: 1.4,
  },
  quickLinksSection: {
    padding: "24px 32px",
    backgroundColor: "#f9fafb",
  },
  quickLinksContainer: {
    textAlign: "center" as const,
  },
  quickLinkCol: {
    width: "50%",
    padding: "8px",
  },
  quickLink: {
    display: "block" as const,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px",
    textDecoration: "none" as const,
    border: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  quickLinkIcon: {
    fontSize: "24px",
    margin: "0 0 4px 0",
    textAlign: "center" as const,
  },
  quickLinkText: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "13px",
    fontWeight: "bold" as const,
    margin: 0,
    textAlign: "center" as const,
  },
  attendeesList: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  attendeeRow: {
    padding: "8px 0",
  },
  attendeeBadge: {
    width: "36px",
    verticalAlign: "middle" as const,
  },
  attendeeBadgeText: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "bold" as const,
    width: "24px",
    height: "24px",
    lineHeight: "24px",
    textAlign: "center" as const,
    borderRadius: "50%",
    margin: 0,
  },
  attendeeName: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "15px",
    fontWeight: "500" as const,
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
    padding: "12px",
    backgroundColor: "#ffffff",
    border: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    borderRadius: "8px",
    textAlign: "center" as const,
    verticalAlign: "top" as const,
  },
  qrImage: {
    border: "3px solid #ffffff",
    borderRadius: "4px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  qrLabel: {
    color: DEFAULT_EMAIL_STYLE.textColor,
    fontSize: "12px",
    fontWeight: "bold" as const,
    margin: "8px 0 0 0",
  },
  ctaSection: {
    padding: "16px 32px 32px 32px",
    textAlign: "center" as const,
  },
  ctaButton: {
    backgroundColor: DEFAULT_EMAIL_STYLE.primaryColor,
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold" as const,
    padding: "14px 32px",
    borderRadius: "6px",
    textDecoration: "none" as const,
    display: "inline-block" as const,
  },
  footer: {
    backgroundColor: "#f9fafb",
    padding: "24px 32px",
    textAlign: "center" as const,
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
  },
  footerExcited: {
    color: DEFAULT_EMAIL_STYLE.primaryColor,
    fontSize: "16px",
    fontWeight: "bold" as const,
    margin: "0 0 16px 0",
  },
  footerDivider: {
    borderTop: `1px solid ${DEFAULT_EMAIL_STYLE.borderColor}`,
    margin: "16px 0",
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
  footerSmall: {
    color: "#9ca3af",
    fontSize: "12px",
    margin: "12px 0 0 0",
  },
}

export default EventReminderEmail
