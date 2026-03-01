import { jsPDF } from 'jspdf'
import { RobotoRegular, RobotoBold, RobotoItalic } from './roboto-font.js'

const PAGE_SIZES = {
  a4: [210, 297],
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
}

const FONT_SIZES = {
  small: 10,
  medium: 12,
  large: 14,
}

const THEMES = {
  light: { bg: [255, 255, 255], text: [30, 30, 30] },
  dark: { bg: [30, 30, 35], text: [230, 230, 230] },
  sepia: { bg: [251, 243, 228], text: [60, 50, 40] },
}

// Register custom Roboto font for Turkish character support
function registerFonts(doc) {
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular)
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold)
  doc.addFileToVFS('Roboto-Italic.ttf', RobotoItalic)

  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
  doc.addFont('Roboto-Italic.ttf', 'Roboto', 'italic')
}

const FONTS = {
  sans: 'Roboto',
  serif: 'Roboto',
  mono: 'Roboto',
}

function parseMarkdown(text) {
  const lines = text.split('\n')
  const parsed = []

  lines.forEach((line, index) => {
    let type = 'text'
    let content = line
    let level = 0

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)/)
    if (headerMatch) {
      type = 'header'
      level = headerMatch[1].length
      content = headerMatch[2]
    }
    // Unordered list
    else if (line.match(/^[-*]\s+/)) {
      type = 'list'
      content = line.replace(/^[-*]\s+/, '')
    }
    // Ordered list
    else if (line.match(/^\d+\.\s+/)) {
      type = 'ordered-list'
      content = line.replace(/^\d+\.\s+/, '')
    }
    // Blockquote
    else if (line.match(/^>\s*/)) {
      type = 'quote'
      content = line.replace(/^>\s*/, '')
    }
    // Horizontal rule
    else if (line.match(/^(---|\*\*\*|___)\s*$/)) {
      type = 'hr'
      content = ''
    }
    // Code block marker
    else if (line.match(/^```/)) {
      type = 'code-block'
      content = ''
    }

    parsed.push({ type, content, level, lineNumber: index + 1 })
  })

  return parsed
}

// Parse inline formatting and return segments with styles
function parseInlineFormatting(text) {
  const segments = []

  // Combined regex for bold and italic
  const regex = /(\*\*|__)(.+?)(\*\*|__)|(\*|_)(.+?)(\*|_)/g
  let lastIndex = 0
  let match

  const tempText = text
  regex.lastIndex = 0

  while ((match = regex.exec(tempText)) !== null) {
    // Add text before match as normal
    if (match.index > lastIndex) {
      segments.push({ text: tempText.slice(lastIndex, match.index), style: 'normal' })
    }

    // Check if bold (**text** or __text__)
    if (match[1] && (match[1] === '**' || match[1] === '__')) {
      segments.push({ text: match[2], style: 'bold' })
    }
    // Check if italic (*text* or _text_)
    else if (match[4] && (match[4] === '*' || match[4] === '_')) {
      segments.push({ text: match[5], style: 'italic' })
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < tempText.length) {
    segments.push({ text: tempText.slice(lastIndex), style: 'normal' })
  }

  // If no formatting found, return whole text as normal
  if (segments.length === 0) {
    segments.push({ text, style: 'normal' })
  }

  return segments
}

export function generatePdf(text, options) {
  const {
    font = 'sans',
    fontSize = 'medium',
    pageSize = 'a4',
    orientation = 'portrait',
    theme = 'light',
    showLineNumbers = false,
    headerText = '',
    showPageNumbers = true,
    enableMarkdown = true,
  } = options

  const [width, height] = PAGE_SIZES[pageSize]
  const isLandscape = orientation === 'landscape'
  const pageWidth = isLandscape ? height : width
  const pageHeight = isLandscape ? width : height

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  })

  // Register Roboto font for Turkish character support
  registerFonts(doc)

  const themeColors = THEMES[theme]
  const baseFontSize = FONT_SIZES[fontSize]
  const fontFamily = FONTS[font]
  const margin = 20
  const lineHeight = baseFontSize * 0.45
  const maxWidth = pageWidth - margin * 2 - (showLineNumbers ? 12 : 0)
  const contentStartX = margin + (showLineNumbers ? 12 : 0)

  let y = margin + (headerText ? 10 : 0)
  let pageNum = 1
  let actualLineNumber = 1

  // Draw background
  function drawBackground() {
    doc.setFillColor(...themeColors.bg)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  // Draw header
  function drawHeader() {
    if (headerText) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(themeColors.text[0], themeColors.text[1], themeColors.text[2])
      doc.text(headerText, pageWidth / 2, 12, { align: 'center' })
    }
  }

  // Draw page number
  function drawPageNumber() {
    if (showPageNumbers) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(themeColors.text[0], themeColors.text[1], themeColors.text[2])
      doc.text(String(pageNum), pageWidth / 2, pageHeight - 10, { align: 'center' })
    }
  }

  // Add new page
  function addPage() {
    drawPageNumber()
    doc.addPage()
    pageNum++
    drawBackground()
    drawHeader()
    y = margin + (headerText ? 10 : 0)
  }

  // Check if need new page
  function checkNewPage(additionalHeight = lineHeight) {
    if (y + additionalHeight > pageHeight - margin - 15) {
      addPage()
      return true
    }
    return false
  }

  // Draw line number
  function drawLineNumber(num) {
    if (showLineNumbers) {
      doc.setFont('courier', 'normal')
      doc.setFontSize(baseFontSize - 2)
      doc.setTextColor(
        Math.min(themeColors.text[0] + 100, 200),
        Math.min(themeColors.text[1] + 100, 200),
        Math.min(themeColors.text[2] + 100, 200)
      )
      doc.text(String(num).padStart(3, ' '), margin, y)
    }
  }

  // Render text with inline formatting (bold/italic)
  function renderFormattedLine(content, startX, currentY) {
    const segments = parseInlineFormatting(content)
    let x = startX

    segments.forEach((segment) => {
      doc.setFont(fontFamily, segment.style)
      doc.setFontSize(baseFontSize)
      doc.setTextColor(...themeColors.text)
      doc.text(segment.text, x, currentY)
      x += doc.getTextWidth(segment.text)
    })
  }

  // Get plain text without markdown markers for width calculation
  function getPlainText(content) {
    return content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
  }

  // Initial setup
  drawBackground()
  drawHeader()

  if (enableMarkdown) {
    const parsed = parseMarkdown(text)
    let inCodeBlock = false

    parsed.forEach((item) => {
      if (item.type === 'code-block') {
        inCodeBlock = !inCodeBlock
        return
      }

      checkNewPage()

      if (showLineNumbers && item.type !== 'hr') {
        drawLineNumber(actualLineNumber)
        actualLineNumber++
      }

      doc.setTextColor(...themeColors.text)

      switch (item.type) {
        case 'header': {
          const headerSizes = { 1: 8, 2: 6, 3: 4, 4: 2, 5: 1, 6: 0 }
          const size = baseFontSize + headerSizes[item.level]
          doc.setFont(fontFamily, 'bold')
          doc.setFontSize(size)
          const lines = doc.splitTextToSize(item.content, maxWidth)
          lines.forEach((line, i) => {
            if (i > 0) {
              checkNewPage()
              if (showLineNumbers) {
                drawLineNumber(actualLineNumber)
                actualLineNumber++
              }
            }
            doc.text(line, contentStartX, y)
            y += lineHeight * (size / baseFontSize)
          })
          y += 2
          break
        }

        case 'list': {
          doc.setFont(fontFamily, 'normal')
          doc.setFontSize(baseFontSize)
          doc.setTextColor(...themeColors.text)
          // Draw bullet
          doc.text('•', contentStartX + 3, y)
          // Draw content with formatting
          const plainListText = getPlainText(item.content)
          const listTextWidth = doc.getTextWidth(plainListText)
          if (listTextWidth <= maxWidth - 12) {
            renderFormattedLine(item.content, contentStartX + 10, y)
            y += lineHeight
          } else {
            const lines = doc.splitTextToSize(plainListText, maxWidth - 12)
            lines.forEach((line, i) => {
              if (i > 0) checkNewPage()
              doc.text(line, contentStartX + 10, y)
              y += lineHeight
            })
          }
          break
        }

        case 'ordered-list': {
          doc.setFont(fontFamily, 'normal')
          doc.setFontSize(baseFontSize)
          const lines = doc.splitTextToSize(item.content, maxWidth - 10)
          lines.forEach((line, i) => {
            if (i > 0) checkNewPage()
            doc.text(line, contentStartX + 8, y)
            y += lineHeight
          })
          break
        }

        case 'quote': {
          doc.setFont(fontFamily, 'italic')
          doc.setFontSize(baseFontSize)
          doc.setTextColor(
            Math.min(themeColors.text[0] + 40, 255),
            Math.min(themeColors.text[1] + 40, 255),
            Math.min(themeColors.text[2] + 40, 255)
          )
          // Draw quote bar
          doc.setDrawColor(themeColors.text[0], themeColors.text[1], themeColors.text[2])
          doc.setLineWidth(0.5)
          doc.line(contentStartX, y - 3, contentStartX, y + 1)

          const lines = doc.splitTextToSize(item.content, maxWidth - 8)
          lines.forEach((line) => {
            checkNewPage()
            doc.text(line, contentStartX + 5, y)
            y += lineHeight
          })
          break
        }

        case 'hr': {
          y += 3
          doc.setDrawColor(
            Math.min(themeColors.text[0] + 100, 230),
            Math.min(themeColors.text[1] + 100, 230),
            Math.min(themeColors.text[2] + 100, 230)
          )
          doc.setLineWidth(0.3)
          doc.line(contentStartX, y, pageWidth - margin, y)
          y += 6
          break
        }

        default: {
          if (inCodeBlock) {
            doc.setFont('courier', 'normal')
            doc.setFontSize(baseFontSize - 1)
            doc.setTextColor(...themeColors.text)
            if (item.content.trim() === '') {
              y += lineHeight * 0.5
            } else {
              doc.text(item.content, contentStartX, y)
              y += lineHeight
            }
          } else {
            if (item.content.trim() === '') {
              y += lineHeight * 0.5
            } else {
              // Check if line fits, if not we need to handle wrapping
              const plainText = getPlainText(item.content)
              doc.setFont(fontFamily, 'normal')
              doc.setFontSize(baseFontSize)
              const textWidth = doc.getTextWidth(plainText)

              if (textWidth <= maxWidth) {
                // Single line - render with formatting
                renderFormattedLine(item.content, contentStartX, y)
                y += lineHeight
              } else {
                // Text needs wrapping - render plain for now
                const lines = doc.splitTextToSize(plainText, maxWidth)
                lines.forEach((line, i) => {
                  if (i > 0) {
                    checkNewPage()
                    if (showLineNumbers) {
                      drawLineNumber(actualLineNumber)
                      actualLineNumber++
                    }
                  }
                  doc.setFont(fontFamily, 'normal')
                  doc.setTextColor(...themeColors.text)
                  doc.text(line, contentStartX, y)
                  y += lineHeight
                })
              }
            }
          }
          break
        }
      }
    })
  } else {
    // Plain text mode
    const lines = text.split('\n')
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(baseFontSize)
    doc.setTextColor(...themeColors.text)

    lines.forEach((line) => {
      if (showLineNumbers) {
        drawLineNumber(actualLineNumber)
        actualLineNumber++
      }

      if (line.trim() === '') {
        y += lineHeight * 0.5
      } else {
        const wrappedLines = doc.splitTextToSize(line, maxWidth)
        wrappedLines.forEach((wrappedLine, i) => {
          checkNewPage()
          if (i > 0 && showLineNumbers) {
            drawLineNumber(actualLineNumber)
            actualLineNumber++
          }
          doc.text(wrappedLine, contentStartX, y)
          y += lineHeight
        })
      }
    })
  }

  // Final page number
  drawPageNumber()

  return doc
}

export function getPreviewUrl(doc) {
  return doc.output('bloburl')
}

export function downloadPdf(doc, filename = 'document') {
  doc.save(`${filename}.pdf`)
}
