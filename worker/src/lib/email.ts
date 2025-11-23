import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private fromEmail: string

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'Columbus <noreply@columbus-aeo.com>'
  }

  async sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set, email not sent:', { to, subject })
        return false
      }

      const { data, error } = await resend.emails.send({
        from: from || this.fromEmail,
        to,
        subject,
        html,
      })

      if (error) {
        console.error('Error sending email:', error)
        return false
      }

      console.log('Email sent successfully:', data)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  // Welcome email when user signs up
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = this.getWelcomeTemplate(userName)
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Columbus - AI Engine Optimization',
      html,
    })
  }

  // Scan completion notification
  async sendScanCompleteEmail(
    userEmail: string,
    userName: string,
    scanResults: {
      brandName: string
      overallScore: number
      totalMentions: number
      recommendations: number
    }
  ): Promise<boolean> {
    const html = this.getScanCompleteTemplate(userName, scanResults)
    return this.sendEmail({
      to: userEmail,
      subject: `Your visibility scan for ${scanResults.brandName} is complete`,
      html,
    })
  }

  // Weekly report email
  async sendWeeklyReport(
    userEmail: string,
    userName: string,
    reportData: {
      brandName: string
      currentScore: number
      previousScore: number | null
      scansThisWeek: number
      topRecommendations: Array<{
        title: string
        impact: string
        status: string
      }>
    }
  ): Promise<boolean> {
    const html = this.getWeeklyReportTemplate(userName, reportData)
    return this.sendEmail({
      to: userEmail,
      subject: `Your weekly Columbus report for ${reportData.brandName}`,
      html,
    })
  }

  // Critical alert (when score drops significantly)
  async sendCriticalAlert(
    userEmail: string,
    userName: string,
    alertData: {
      brandName: string
      previousScore: number
      currentScore: number
      dropPercentage: number
    }
  ): Promise<boolean> {
    const html = this.getCriticalAlertTemplate(userName, alertData)
    return this.sendEmail({
      to: userEmail,
      subject: `⚠️ Alert: Visibility score drop detected for ${alertData.brandName}`,
      html,
    })
  }

  // Template methods
  private getWelcomeTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Columbus</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .feature {
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-left: 4px solid #667eea;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Columbus!</h1>
    <p>Your journey to AI visibility starts now</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Welcome to Columbus! We're excited to help you optimize your visibility across AI search engines like ChatGPT, Claude, Gemini, and Perplexity.</p>

    <h2>🚀 Get Started</h2>
    <p>Here's what you can do right now:</p>

    <div class="feature">
      <strong>1. Run Your First Scan</strong>
      <p>Discover how visible your brand is across major AI engines. We'll analyze mentions, sentiment, and provide actionable recommendations.</p>
    </div>

    <div class="feature">
      <strong>2. Set Up Competitor Tracking</strong>
      <p>Add your competitors to see how you stack up and identify opportunities to gain an edge.</p>
    </div>

    <div class="feature">
      <strong>3. Implement Recommendations</strong>
      <p>Follow our platform-specific guides to improve your visibility score and AI rankings.</p>
    </div>

    <a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/dashboard" class="button">Go to Dashboard</a>

    <h2>📊 What is AEO?</h2>
    <p>AI Engine Optimization (AEO) is the practice of optimizing your online presence to rank higher in AI-powered search results. As more users turn to ChatGPT, Claude, and other AI assistants for recommendations, AEO is becoming critical for business growth.</p>

    <h2>Need Help?</h2>
    <p>Check out our <a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/docs">documentation</a> or reply to this email with any questions.</p>

    <p>Best regards,<br>The Columbus Team</p>
  </div>

  <div class="footer">
    <p>Columbus - AI Engine Optimization Platform</p>
    <p>You're receiving this email because you signed up for Columbus.</p>
  </div>
</body>
</html>
    `
  }

  private getScanCompleteTemplate(
    userName: string,
    scanResults: {
      brandName: string
      overallScore: number
      totalMentions: number
      recommendations: number
    }
  ): string {
    const scoreColor = scanResults.overallScore >= 70 ? '#10b981' : scanResults.overallScore >= 40 ? '#f59e0b' : '#ef4444'
    const scoreEmoji = scanResults.overallScore >= 70 ? '🎉' : scanResults.overallScore >= 40 ? '⚡' : '🔔'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scan Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .score-card {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
      border: 2px solid ${scoreColor};
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: ${scoreColor};
      margin: 10px 0;
    }
    .metric {
      display: inline-block;
      margin: 10px 20px;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${scoreEmoji} Scan Complete!</h1>
    <p>Your visibility report for ${scanResults.brandName} is ready</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Great news! We've completed the visibility scan for <strong>${scanResults.brandName}</strong> across ChatGPT, Claude, Gemini, and Perplexity.</p>

    <div class="score-card">
      <div>Overall Visibility Score</div>
      <div class="score">${scanResults.overallScore}/100</div>
      <div style="margin-top: 20px;">
        <div class="metric">
          <div class="metric-value">${scanResults.totalMentions}</div>
          <div class="metric-label">Total Mentions</div>
        </div>
        <div class="metric">
          <div class="metric-value">${scanResults.recommendations}</div>
          <div class="metric-label">Recommendations</div>
        </div>
      </div>
    </div>

    <h2>📈 What This Means</h2>
    <p>${this.getScoreInsight(scanResults.overallScore)}</p>

    <h2>🎯 Next Steps</h2>
    <p>We've generated ${scanResults.recommendations} personalized recommendations to help improve your visibility. These include:</p>
    <ul>
      <li>Content optimization strategies</li>
      <li>Platform-specific improvements</li>
      <li>Competitive positioning opportunities</li>
    </ul>

    <a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/dashboard/recommendations" class="button">View Recommendations</a>

    <p>Best regards,<br>The Columbus Team</p>
  </div>

  <div class="footer">
    <p>Columbus - AI Engine Optimization Platform</p>
  </div>
</body>
</html>
    `
  }

  private getWeeklyReportTemplate(
    userName: string,
    reportData: {
      brandName: string
      currentScore: number
      previousScore: number | null
      scansThisWeek: number
      topRecommendations: Array<{
        title: string
        impact: string
        status: string
      }>
    }
  ): string {
    const scoreDiff = reportData.previousScore !== null ? reportData.currentScore - reportData.previousScore : 0
    const trendEmoji = scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➡️'
    const trendText = scoreDiff > 0 ? `+${scoreDiff} points` : scoreDiff < 0 ? `${scoreDiff} points` : 'No change'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #667eea;
    }
    .trend {
      font-size: 24px;
      font-weight: bold;
      color: ${scoreDiff >= 0 ? '#10b981' : '#ef4444'};
    }
    .recommendation {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 15px;
      margin: 10px 0;
      border-radius: 6px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #dbeafe;
      color: #1e40af;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Your Weekly Report</h1>
    <p>${reportData.brandName} - Week in Review</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <p>Here's your weekly visibility report for <strong>${reportData.brandName}</strong>:</p>

    <div class="stat-card">
      <h3>Current Visibility Score</h3>
      <div style="font-size: 36px; font-weight: bold; color: #667eea;">${reportData.currentScore}/100</div>
      <div class="trend">${trendEmoji} ${trendText}</div>
      ${reportData.previousScore !== null ? `<div style="color: #6b7280; font-size: 14px; margin-top: 10px;">Previous: ${reportData.previousScore}/100</div>` : ''}
    </div>

    <div class="stat-card">
      <h3>Activity This Week</h3>
      <p><strong>${reportData.scansThisWeek}</strong> visibility scans completed</p>
      <p><strong>${reportData.topRecommendations.length}</strong> active recommendations</p>
    </div>

    <h2>🎯 Top Recommendations</h2>
    ${reportData.topRecommendations.map(rec => `
      <div class="recommendation">
        <strong>${rec.title}</strong>
        <div style="margin-top: 5px;">
          <span class="badge">Impact: ${rec.impact}</span>
          <span class="badge" style="background: ${rec.status === 'completed' ? '#d1fae5' : '#fef3c7'}; color: ${rec.status === 'completed' ? '#065f46' : '#92400e'};">${rec.status}</span>
        </div>
      </div>
    `).join('')}

    <a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/dashboard" class="button">View Full Dashboard</a>

    <h2>💡 Quick Tips</h2>
    <ul>
      <li>Implement high-impact recommendations first for the biggest visibility gains</li>
      <li>Monitor your competitors' activity to stay ahead</li>
      <li>Run regular scans to track your progress over time</li>
    </ul>

    <p>Keep up the great work!</p>

    <p>Best regards,<br>The Columbus Team</p>
  </div>

  <div class="footer">
    <p>Columbus - AI Engine Optimization Platform</p>
    <p><a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/settings">Manage email preferences</a></p>
  </div>
</body>
</html>
    `
  }

  private getCriticalAlertTemplate(
    userName: string,
    alertData: {
      brandName: string
      previousScore: number
      currentScore: number
      dropPercentage: number
    }
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Critical Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .alert-box {
      background: #fef2f2;
      border: 2px solid #ef4444;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .score-comparison {
      display: flex;
      justify-content: space-around;
      margin: 20px 0;
      text-align: center;
    }
    .score-item {
      flex: 1;
    }
    .button {
      display: inline-block;
      background: #ef4444;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Visibility Alert</h1>
    <p>Significant score drop detected</p>
  </div>

  <div class="content">
    <p>Hi ${userName},</p>

    <div class="alert-box">
      <p><strong>We've detected a ${alertData.dropPercentage}% drop in your visibility score for ${alertData.brandName}.</strong></p>
    </div>

    <div class="score-comparison">
      <div class="score-item">
        <div style="color: #6b7280;">Previous Score</div>
        <div style="font-size: 32px; font-weight: bold; color: #667eea;">${alertData.previousScore}</div>
      </div>
      <div class="score-item">
        <div style="font-size: 48px; color: #ef4444;">→</div>
      </div>
      <div class="score-item">
        <div style="color: #6b7280;">Current Score</div>
        <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${alertData.currentScore}</div>
      </div>
    </div>

    <h2>🔍 What This Means</h2>
    <p>A significant drop in your visibility score could indicate:</p>
    <ul>
      <li>Changes in AI engine algorithms</li>
      <li>Competitors gaining ground</li>
      <li>Recent negative mentions or sentiment shifts</li>
      <li>Content or website changes affecting visibility</li>
    </ul>

    <h2>✅ Recommended Actions</h2>
    <ol>
      <li>Review your latest scan results to identify specific issues</li>
      <li>Check for new recommendations in your dashboard</li>
      <li>Compare your performance against competitors</li>
      <li>Consider running a fresh scan to get updated data</li>
    </ol>

    <a href="${process.env.FRONTEND_URL || 'https://columbus-aeo.com'}/dashboard" class="button">Investigate Now</a>

    <p>Don't worry - we're here to help you recover and improve. Our recommendations are designed to help you address these issues quickly.</p>

    <p>Best regards,<br>The Columbus Team</p>
  </div>

  <div class="footer">
    <p>Columbus - AI Engine Optimization Platform</p>
  </div>
</body>
</html>
    `
  }

  private getScoreInsight(score: number): string {
    if (score >= 80) {
      return "Excellent! Your brand has strong visibility across AI engines. Focus on maintaining this position and monitoring competitors."
    } else if (score >= 60) {
      return "Good visibility with room for improvement. Follow our recommendations to reach the next level."
    } else if (score >= 40) {
      return "Moderate visibility. There are significant opportunities to improve your AI engine presence."
    } else {
      return "Your visibility needs attention. Start with our high-impact recommendations to quickly improve your score."
    }
  }
}

export const emailService = new EmailService()
