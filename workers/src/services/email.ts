import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ScanCompletedEmailData {
  recipientEmail: string
  recipientName: string
  brandName: string
  scanType: 'visibility' | 'competitor' | 'website'
  totalScans: number
  visibilityScore?: number
  dashboardUrl: string
}

export interface WeeklySummaryEmailData {
  recipientEmail: string
  recipientName: string
  brandName: string
  scansThisWeek: number
  averageVisibility: number
  topPerformingPrompts: Array<{
    prompt: string
    mentions: number
  }>
  dashboardUrl: string
}

/**
 * Send scan completion notification
 */
export async function sendScanCompletedEmail(data: ScanCompletedEmailData) {
  const scanTypeLabel = {
    visibility: 'Visibility Scan',
    competitor: 'Competitor Analysis',
    website: 'Website Analysis'
  }[data.scanType]

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'Columbus <noreply@columbus-aeo.com>',
      to: [data.recipientEmail],
      subject: `${scanTypeLabel} Complete for ${data.brandName}`,
      html: generateScanCompletedHtml(data, scanTypeLabel)
    })

    if (error) {
      console.error('[Email] Error sending scan completed email:', error)
      throw error
    }

    console.log(`[Email] Scan completed email sent to ${data.recipientEmail}`)
    return result
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    throw error
  }
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(data: WeeklySummaryEmailData) {
  try {
    const { data: result, error } = await resend.emails.send({
      from: 'Columbus <noreply@columbus-aeo.com>',
      to: [data.recipientEmail],
      subject: `Weekly Visibility Report for ${data.brandName}`,
      html: generateWeeklySummaryHtml(data)
    })

    if (error) {
      console.error('[Email] Error sending weekly summary:', error)
      throw error
    }

    console.log(`[Email] Weekly summary sent to ${data.recipientEmail}`)
    return result
  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    throw error
  }
}

/**
 * Generate HTML for scan completed email
 */
function generateScanCompletedHtml(
  data: ScanCompletedEmailData,
  scanTypeLabel: string
): string {
  const visibilitySection = data.visibilityScore !== undefined
    ? `
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1a202c; margin: 0 0 10px 0;">Visibility Score</h3>
        <p style="font-size: 36px; font-weight: bold; color: #2563eb; margin: 0;">
          ${data.visibilityScore}%
        </p>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2563eb; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Columbus AEO</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">AI-powered visibility optimization</p>
      </div>

      <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1a202c; margin-top: 0;">${scanTypeLabel} Complete</h2>

        <p>Hi ${data.recipientName},</p>

        <p>Great news! Your ${scanTypeLabel.toLowerCase()} for <strong>${data.brandName}</strong> has completed successfully.</p>

        ${visibilitySection}

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563;">
            <strong>Total Scans:</strong> ${data.totalScans}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Full Report
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This scan analyzed your brand's visibility across ChatGPT, Perplexity, and other AI platforms to help you optimize your presence.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Columbus AEO - AI-Powered Visibility Optimization</p>
        <p style="margin: 5px 0;">
          <a href="https://columbus-aeo.com" style="color: #2563eb; text-decoration: none;">columbus-aeo.com</a>
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML for weekly summary email
 */
function generateWeeklySummaryHtml(data: WeeklySummaryEmailData): string {
  const topPromptsHtml = data.topPerformingPrompts
    .map(
      (p, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.prompt}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #2563eb;">${p.mentions}</td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2563eb; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Columbus AEO</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Weekly Visibility Report</p>
      </div>

      <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1a202c; margin-top: 0;">Weekly Report for ${data.brandName}</h2>

        <p>Hi ${data.recipientName},</p>

        <p>Here's your weekly visibility summary for <strong>${data.brandName}</strong>:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Scans This Week</p>
            <p style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 10px 0 0 0;">
              ${data.scansThisWeek}
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Avg Visibility</p>
            <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 10px 0 0 0;">
              ${data.averageVisibility}%
            </p>
          </div>
        </div>

        <h3 style="color: #1a202c; margin-top: 30px;">Top Performing Prompts</h3>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">#</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Prompt</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Mentions</th>
            </tr>
          </thead>
          <tbody>
            ${topPromptsHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Full Dashboard
          </a>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>Columbus AEO - AI-Powered Visibility Optimization</p>
        <p style="margin: 5px 0;">
          <a href="https://columbus-aeo.com" style="color: #2563eb; text-decoration: none;">columbus-aeo.com</a>
        </p>
      </div>
    </body>
    </html>
  `
}
