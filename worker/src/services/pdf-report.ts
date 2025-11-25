// @ts-ignore - pdfkit types may not be installed
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

export interface ReportData {
  organizationName: string
  domain: string
  generatedAt: Date
  period: {
    start: Date
    end: Date
  }
  visibilityScore: {
    current: number
    previous: number
    trend: 'up' | 'down' | 'stable'
  }
  aiModelBreakdown: {
    model: string
    mentionRate: number
    citationRate: number
    avgPosition: number | null
  }[]
  topPerformingPrompts: {
    promptText: string
    mentionRate: number
    models: string[]
  }[]
  weakestPrompts: {
    promptText: string
    mentionRate: number
    models: string[]
  }[]
  competitorComparison: {
    name: string
    mentionRate: number
    avgPosition: number | null
  }[]
  recommendations: {
    title: string
    description: string
    priority: number
    category: string
  }[]
  freshnessMetrics?: {
    avgFreshnessScore: number
    stalePages: number
    totalMonitoredPages: number
  }
  aeoReadiness?: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
}

// Brand colors
const COLORS = {
  primary: '#2563EB', // Blue
  secondary: '#10B981', // Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  text: '#1F2937', // Gray 800
  textLight: '#6B7280', // Gray 500
  border: '#E5E7EB', // Gray 200
  background: '#F9FAFB', // Gray 50
}

/**
 * PDF Report Generator
 * Creates executive summary reports for AI visibility metrics
 */
export class PDFReportGenerator {
  private doc: any // PDFDocument instance
  private currentY: number = 50

  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    })
  }

  /**
   * Generate PDF report and return as buffer
   */
  async generateReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = new PassThrough()

      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)

      this.doc.pipe(stream)

      try {
        this.generateContent(data)
        this.doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }

  private generateContent(data: ReportData): void {
    // Cover page
    this.generateCoverPage(data)

    // Executive Summary
    this.doc.addPage()
    this.currentY = 50
    this.generateExecutiveSummary(data)

    // AI Model Performance
    this.doc.addPage()
    this.currentY = 50
    this.generateAIModelSection(data)

    // Prompt Performance
    this.doc.addPage()
    this.currentY = 50
    this.generatePromptPerformance(data)

    // Competitor Analysis (if data available)
    if (data.competitorComparison.length > 0) {
      this.doc.addPage()
      this.currentY = 50
      this.generateCompetitorSection(data)
    }

    // Recommendations
    this.doc.addPage()
    this.currentY = 50
    this.generateRecommendations(data)

    // Add page numbers
    this.addPageNumbers()
  }

  private generateCoverPage(data: ReportData): void {
    const pageWidth = this.doc.page.width
    const centerX = pageWidth / 2

    // Logo area (placeholder)
    this.doc
      .fontSize(32)
      .fillColor(COLORS.primary)
      .text('COLUMBUS', 50, 150, { align: 'center', width: pageWidth - 100 })

    this.doc
      .fontSize(14)
      .fillColor(COLORS.textLight)
      .text('AI Visibility Intelligence', 50, 190, { align: 'center', width: pageWidth - 100 })

    // Report title
    this.doc
      .fontSize(28)
      .fillColor(COLORS.text)
      .text('Executive Summary Report', 50, 280, { align: 'center', width: pageWidth - 100 })

    // Organization name
    this.doc
      .fontSize(20)
      .fillColor(COLORS.primary)
      .text(data.organizationName, 50, 330, { align: 'center', width: pageWidth - 100 })

    // Domain
    this.doc
      .fontSize(14)
      .fillColor(COLORS.textLight)
      .text(data.domain, 50, 360, { align: 'center', width: pageWidth - 100 })

    // Divider line
    this.doc
      .moveTo(150, 420)
      .lineTo(pageWidth - 150, 420)
      .strokeColor(COLORS.border)
      .lineWidth(2)
      .stroke()

    // Report period
    this.doc
      .fontSize(12)
      .fillColor(COLORS.textLight)
      .text('Report Period', 50, 460, { align: 'center', width: pageWidth - 100 })

    this.doc
      .fontSize(14)
      .fillColor(COLORS.text)
      .text(
        `${this.formatDate(data.period.start)} - ${this.formatDate(data.period.end)}`,
        50, 480, { align: 'center', width: pageWidth - 100 }
      )

    // Generated date
    this.doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text(
        `Generated on ${this.formatDate(data.generatedAt)} at ${this.formatTime(data.generatedAt)}`,
        50, 700, { align: 'center', width: pageWidth - 100 }
      )
  }

  private generateExecutiveSummary(data: ReportData): void {
    this.drawSectionHeader('Executive Summary')

    // Visibility Score Card
    this.drawScoreCard(
      'Overall Visibility Score',
      data.visibilityScore.current,
      data.visibilityScore.previous,
      data.visibilityScore.trend
    )

    this.currentY += 30

    // Key metrics in a row
    const metricsStartY = this.currentY
    const metricWidth = 150

    // Calculate overall stats
    const totalMentions = data.aiModelBreakdown.reduce((sum, m) => sum + m.mentionRate, 0)
    const avgMentionRate = data.aiModelBreakdown.length > 0
      ? Math.round(totalMentions / data.aiModelBreakdown.length)
      : 0

    const totalCitations = data.aiModelBreakdown.reduce((sum, m) => sum + m.citationRate, 0)
    const avgCitationRate = data.aiModelBreakdown.length > 0
      ? Math.round(totalCitations / data.aiModelBreakdown.length)
      : 0

    this.drawMetricBox('Mention Rate', `${avgMentionRate}%`, 50, metricsStartY, metricWidth)
    this.drawMetricBox('Citation Rate', `${avgCitationRate}%`, 210, metricsStartY, metricWidth)
    this.drawMetricBox('AI Models Tracked', `${data.aiModelBreakdown.length}`, 370, metricsStartY, metricWidth)

    this.currentY = metricsStartY + 100

    // Summary text
    this.doc
      .fontSize(11)
      .fillColor(COLORS.text)

    const summaryText = this.generateSummaryText(data)
    this.doc.text(summaryText, 50, this.currentY, {
      width: this.doc.page.width - 100,
      align: 'justify',
      lineGap: 4
    })

    this.currentY = this.doc.y + 30

    // AEO Readiness if available
    if (data.aeoReadiness) {
      this.drawSectionHeader('AEO Readiness', 16)

      this.drawScoreBar('AEO Score', data.aeoReadiness.score)
      this.currentY += 20

      if (data.aeoReadiness.strengths.length > 0) {
        this.doc
          .fontSize(10)
          .fillColor(COLORS.secondary)
          .text('Strengths:', 50, this.currentY)
        this.currentY += 15

        data.aeoReadiness.strengths.slice(0, 3).forEach(strength => {
          this.doc
            .fontSize(9)
            .fillColor(COLORS.text)
            .text(`  + ${strength}`, 50, this.currentY)
          this.currentY += 12
        })
      }

      this.currentY += 10

      if (data.aeoReadiness.weaknesses.length > 0) {
        this.doc
          .fontSize(10)
          .fillColor(COLORS.warning)
          .text('Areas for Improvement:', 50, this.currentY)
        this.currentY += 15

        data.aeoReadiness.weaknesses.slice(0, 3).forEach(weakness => {
          this.doc
            .fontSize(9)
            .fillColor(COLORS.text)
            .text(`  - ${weakness}`, 50, this.currentY)
          this.currentY += 12
        })
      }
    }
  }

  private generateAIModelSection(data: ReportData): void {
    this.drawSectionHeader('AI Model Performance')

    // Table header
    const columns = [
      { label: 'AI Model', width: 120, x: 50 },
      { label: 'Mention Rate', width: 100, x: 170 },
      { label: 'Citation Rate', width: 100, x: 270 },
      { label: 'Avg Position', width: 100, x: 370 }
    ]

    this.currentY += 10
    const headerY = this.currentY

    // Draw header background
    this.doc
      .rect(50, headerY, this.doc.page.width - 100, 25)
      .fillColor(COLORS.primary)
      .fill()

    // Draw header text
    columns.forEach(col => {
      this.doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text(col.label, col.x + 5, headerY + 7, { width: col.width - 10 })
    })

    this.currentY = headerY + 30

    // Draw rows
    data.aiModelBreakdown.forEach((model, index) => {
      const rowY = this.currentY

      // Alternate row background
      if (index % 2 === 0) {
        this.doc
          .rect(50, rowY, this.doc.page.width - 100, 25)
          .fillColor(COLORS.background)
          .fill()
      }

      this.doc.fontSize(10).fillColor(COLORS.text)

      // Model name
      this.doc.text(this.formatModelName(model.model), columns[0].x + 5, rowY + 7, { width: columns[0].width - 10 })

      // Mention rate with color coding
      const mentionColor = model.mentionRate >= 50 ? COLORS.secondary : model.mentionRate >= 25 ? COLORS.warning : COLORS.danger
      this.doc.fillColor(mentionColor).text(`${model.mentionRate}%`, columns[1].x + 5, rowY + 7, { width: columns[1].width - 10 })

      // Citation rate
      this.doc.fillColor(COLORS.text).text(`${model.citationRate}%`, columns[2].x + 5, rowY + 7, { width: columns[2].width - 10 })

      // Position
      this.doc.text(model.avgPosition ? `#${model.avgPosition.toFixed(1)}` : 'N/A', columns[3].x + 5, rowY + 7, { width: columns[3].width - 10 })

      this.currentY += 25
    })

    this.currentY += 30

    // Model insights
    this.doc
      .fontSize(12)
      .fillColor(COLORS.text)
      .text('Key Insights:', 50, this.currentY)

    this.currentY += 20

    const insights = this.generateModelInsights(data.aiModelBreakdown)
    insights.forEach(insight => {
      this.doc
        .fontSize(10)
        .fillColor(COLORS.textLight)
        .text(`• ${insight}`, 60, this.currentY, { width: this.doc.page.width - 120 })
      this.currentY += 18
    })
  }

  private generatePromptPerformance(data: ReportData): void {
    this.drawSectionHeader('Prompt Performance Analysis')

    // Top performing prompts
    this.doc
      .fontSize(14)
      .fillColor(COLORS.secondary)
      .text('Top Performing Prompts', 50, this.currentY)

    this.currentY += 20

    data.topPerformingPrompts.slice(0, 5).forEach((prompt, index) => {
      this.drawPromptCard(prompt, index + 1, 'success')
      this.currentY += 60
    })

    // Check if we need a new page
    if (this.currentY > 650) {
      this.doc.addPage()
      this.currentY = 50
    } else {
      this.currentY += 20
    }

    // Weakest prompts
    this.doc
      .fontSize(14)
      .fillColor(COLORS.warning)
      .text('Prompts Needing Attention', 50, this.currentY)

    this.currentY += 20

    data.weakestPrompts.slice(0, 5).forEach((prompt, index) => {
      this.drawPromptCard(prompt, index + 1, 'warning')
      this.currentY += 60
    })
  }

  private generateCompetitorSection(data: ReportData): void {
    this.drawSectionHeader('Competitor Analysis')

    // Sort competitors by mention rate
    const sortedCompetitors = [...data.competitorComparison].sort((a, b) => b.mentionRate - a.mentionRate)

    // Find your position
    const yourPosition = sortedCompetitors.findIndex(c => c.name === data.organizationName) + 1

    // Summary
    this.doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(
        yourPosition > 0
          ? `Your brand ranks #${yourPosition} out of ${sortedCompetitors.length} tracked competitors for AI visibility.`
          : `Tracking ${sortedCompetitors.length} competitors for AI visibility.`,
        50, this.currentY, { width: this.doc.page.width - 100 }
      )

    this.currentY += 30

    // Competitor bars
    sortedCompetitors.forEach((competitor, index) => {
      const isYou = competitor.name === data.organizationName
      this.drawCompetitorBar(competitor, index + 1, isYou)
      this.currentY += 35
    })
  }

  private generateRecommendations(data: ReportData): void {
    this.drawSectionHeader('Recommendations')

    // Sort by priority
    const sortedRecs = [...data.recommendations].sort((a, b) => b.priority - a.priority)

    sortedRecs.slice(0, 6).forEach((rec, index) => {
      if (this.currentY > 700) {
        this.doc.addPage()
        this.currentY = 50
      }

      this.drawRecommendationCard(rec, index + 1)
      this.currentY += 80
    })
  }

  // Helper methods
  private drawSectionHeader(title: string, fontSize: number = 20): void {
    this.doc
      .fontSize(fontSize)
      .fillColor(COLORS.primary)
      .text(title, 50, this.currentY)

    this.currentY += fontSize + 10

    // Underline
    this.doc
      .moveTo(50, this.currentY)
      .lineTo(200, this.currentY)
      .strokeColor(COLORS.primary)
      .lineWidth(2)
      .stroke()

    this.currentY += 20
  }

  private drawScoreCard(label: string, current: number, previous: number, trend: string): void {
    const cardX = 50
    const cardWidth = 200

    // Card background
    this.doc
      .roundedRect(cardX, this.currentY, cardWidth, 100, 8)
      .fillColor(COLORS.background)
      .fill()

    // Label
    this.doc
      .fontSize(10)
      .fillColor(COLORS.textLight)
      .text(label, cardX + 15, this.currentY + 15)

    // Score
    const scoreColor = current >= 70 ? COLORS.secondary : current >= 40 ? COLORS.warning : COLORS.danger
    this.doc
      .fontSize(36)
      .fillColor(scoreColor)
      .text(`${current}`, cardX + 15, this.currentY + 35)

    // Trend indicator
    const trendSymbol = trend === 'up' ? '+' : trend === 'down' ? '-' : ''
    const change = Math.abs(current - previous)
    const trendColor = trend === 'up' ? COLORS.secondary : trend === 'down' ? COLORS.danger : COLORS.textLight

    this.doc
      .fontSize(12)
      .fillColor(trendColor)
      .text(`${trendSymbol}${change} from previous`, cardX + 15, this.currentY + 80)

    this.currentY += 110
  }

  private drawMetricBox(label: string, value: string, x: number, y: number, width: number): void {
    this.doc
      .roundedRect(x, y, width, 70, 5)
      .fillColor(COLORS.background)
      .fill()

    this.doc
      .fontSize(9)
      .fillColor(COLORS.textLight)
      .text(label, x + 10, y + 10, { width: width - 20 })

    this.doc
      .fontSize(24)
      .fillColor(COLORS.primary)
      .text(value, x + 10, y + 30, { width: width - 20 })
  }

  private drawScoreBar(label: string, score: number): void {
    const barWidth = this.doc.page.width - 150
    const barHeight = 20

    this.doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(`${label}: ${score}/100`, 50, this.currentY)

    this.currentY += 15

    // Background bar
    this.doc
      .roundedRect(50, this.currentY, barWidth, barHeight, 3)
      .fillColor(COLORS.border)
      .fill()

    // Score bar
    const fillWidth = (score / 100) * barWidth
    const fillColor = score >= 70 ? COLORS.secondary : score >= 40 ? COLORS.warning : COLORS.danger

    this.doc
      .roundedRect(50, this.currentY, fillWidth, barHeight, 3)
      .fillColor(fillColor)
      .fill()

    this.currentY += barHeight + 10
  }

  private drawPromptCard(prompt: { promptText: string; mentionRate: number; models: string[] }, rank: number, type: 'success' | 'warning'): void {
    const cardColor = type === 'success' ? COLORS.secondary : COLORS.warning

    // Rank circle
    this.doc
      .circle(65, this.currentY + 20, 12)
      .fillColor(cardColor)
      .fill()

    this.doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text(`${rank}`, 60, this.currentY + 16)

    // Prompt text
    this.doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(`"${prompt.promptText.substring(0, 80)}${prompt.promptText.length > 80 ? '...' : ''}"`, 90, this.currentY + 5, {
        width: this.doc.page.width - 150
      })

    // Metrics
    this.doc
      .fontSize(9)
      .fillColor(COLORS.textLight)
      .text(`Mention Rate: ${prompt.mentionRate}% | Models: ${prompt.models.join(', ')}`, 90, this.currentY + 35)
  }

  private drawCompetitorBar(competitor: { name: string; mentionRate: number }, rank: number, isYou: boolean): void {
    const barWidth = this.doc.page.width - 200
    const barHeight = 20

    // Rank and name
    this.doc
      .fontSize(10)
      .fillColor(isYou ? COLORS.primary : COLORS.text)
      .text(`${rank}. ${competitor.name}${isYou ? ' (You)' : ''}`, 50, this.currentY)

    this.currentY += 15

    // Background bar
    this.doc
      .roundedRect(50, this.currentY, barWidth, barHeight, 3)
      .fillColor(COLORS.border)
      .fill()

    // Score bar
    const fillWidth = (competitor.mentionRate / 100) * barWidth
    const fillColor = isYou ? COLORS.primary : COLORS.textLight

    this.doc
      .roundedRect(50, this.currentY, fillWidth, barHeight, 3)
      .fillColor(fillColor)
      .fill()

    // Percentage text
    this.doc
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(`${competitor.mentionRate}%`, barWidth + 60, this.currentY + 5)
  }

  private drawRecommendationCard(rec: { title: string; description: string; priority: number; category: string }, number: number): void {
    const priorityColor = rec.priority >= 4 ? COLORS.danger : rec.priority >= 3 ? COLORS.warning : COLORS.secondary

    // Number badge
    this.doc
      .circle(65, this.currentY + 15, 12)
      .fillColor(priorityColor)
      .fill()

    this.doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text(`${number}`, 60, this.currentY + 11)

    // Title
    this.doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(rec.title, 90, this.currentY + 5, { width: this.doc.page.width - 150 })

    // Category badge
    this.doc
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text(`[${rec.category.toUpperCase()}]`, 90, this.currentY + 22)

    // Description
    this.doc
      .fontSize(9)
      .fillColor(COLORS.textLight)
      .text(rec.description.substring(0, 150) + (rec.description.length > 150 ? '...' : ''), 90, this.currentY + 38, {
        width: this.doc.page.width - 150,
        lineGap: 2
      })
  }

  private addPageNumbers(): void {
    const pages = this.doc.bufferedPageRange()
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      this.doc.switchToPage(i)
      this.doc
        .fontSize(9)
        .fillColor(COLORS.textLight)
        .text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          this.doc.page.height - 40,
          { align: 'center', width: this.doc.page.width - 100 }
        )
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  private formatModelName(model: string): string {
    const names: Record<string, string> = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity'
    }
    return names[model] || model
  }

  private generateSummaryText(data: ReportData): string {
    const trend = data.visibilityScore.trend === 'up'
      ? 'increased'
      : data.visibilityScore.trend === 'down'
        ? 'decreased'
        : 'remained stable'

    const change = Math.abs(data.visibilityScore.current - data.visibilityScore.previous)

    let summary = `During the reporting period, ${data.organizationName}'s AI visibility score ${trend}`
    if (change > 0) {
      summary += ` by ${change} points`
    }
    summary += `, reaching ${data.visibilityScore.current} out of 100. `

    const bestModel = data.aiModelBreakdown.reduce((best, current) =>
      current.mentionRate > (best?.mentionRate || 0) ? current : best, data.aiModelBreakdown[0])

    if (bestModel) {
      summary += `${this.formatModelName(bestModel.model)} showed the highest brand mention rate at ${bestModel.mentionRate}%. `
    }

    if (data.recommendations.length > 0) {
      summary += `We have identified ${data.recommendations.length} actionable recommendations to improve your AI visibility.`
    }

    return summary
  }

  private generateModelInsights(models: ReportData['aiModelBreakdown']): string[] {
    const insights: string[] = []

    if (models.length === 0) return ['No model data available']

    const bestMention = models.reduce((best, m) => m.mentionRate > best.mentionRate ? m : best, models[0])
    const worstMention = models.reduce((worst, m) => m.mentionRate < worst.mentionRate ? m : worst, models[0])

    insights.push(`${this.formatModelName(bestMention.model)} has the highest mention rate at ${bestMention.mentionRate}%`)

    if (bestMention.model !== worstMention.model) {
      insights.push(`${this.formatModelName(worstMention.model)} needs improvement with only ${worstMention.mentionRate}% mention rate`)
    }

    const avgCitation = models.reduce((sum, m) => sum + m.citationRate, 0) / models.length
    if (avgCitation < 20) {
      insights.push('Citation rates are low across all models - consider adding more structured data to your content')
    }

    return insights
  }
}

/**
 * Generate PDF report from data
 */
export async function generatePDFReport(data: ReportData): Promise<Buffer> {
  const generator = new PDFReportGenerator()
  return generator.generateReport(data)
}
