import { useState, useCallback, useEffect, useRef } from 'react'
import { generatePdf, getPreviewUrl, downloadPdf } from './utils/generatePdf'

const PLACEHOLDER_TEXT = `# My Ghost Lover

**Irem**

---

Is this a punishment
Is this the suffering I endure
Will the vigil I've kept for years never end?

I am like a tiny snowflake
Melting in your palm, come back my love
If I see your tears
My wings will melt
I cannot fly to your side in dreams

Eternity began with you
In that little world of mine
Don't forget, when you left, I remained incomplete

I'm in deserts, I'm burning
I'm at the poles, I'm freezing
I'm the one suffering the punishment, please come back

I reach out but cannot hold
I miss you, I cry
Are you forbidden, I don't understand, please come back

Even if you don't love me, I missed your voice
Even if I say go, if only you wouldn't
Is this longing I've carried for years suffering or a curse?
If only I knew whether you're forbidden to me

> You are mine, my ghost lover
> You are mine, my ghost lover
> My ghost lover`

export default function App() {
  const [text, setText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [filename, setFilename] = useState('document')
  const textareaRef = useRef(null)
  const pdfDocRef = useRef(null)

  const [settings, setSettings] = useState({
    font: 'sans',
    fontSize: 'medium',
    pageSize: 'a4',
    orientation: 'portrait',
    theme: 'light',
    showLineNumbers: false,
    headerText: '',
    showPageNumbers: true,
    enableMarkdown: true,
  })

  const stats = {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setPreviewUrl(null)
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    setPreviewUrl(null)
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setText(event.target.result)
        setPreviewUrl(null)
        const name = file.name.replace(/\.(txt|md)$/, '')
        setFilename(name)
      }
      reader.readAsText(file)
    }
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setText(event.target.result)
        setPreviewUrl(null)
        const name = file.name.replace(/\.(txt|md)$/, '')
        setFilename(name)
      }
      reader.readAsText(file)
    }
  }

  const generatePreview = useCallback(() => {
    if (!text.trim()) return

    setIsGenerating(true)
    setTimeout(() => {
      try {
        const doc = generatePdf(text, settings)
        pdfDocRef.current = doc
        const url = getPreviewUrl(doc)
        setPreviewUrl(url)
        setShowPreview(true)
      } catch (err) {
        console.error('PDF generation error:', err)
      }
      setIsGenerating(false)
    }, 100)
  }, [text, settings])

  const handleDownload = () => {
    if (!text.trim()) return

    if (pdfDocRef.current) {
      downloadPdf(pdfDocRef.current, filename)
    } else {
      const doc = generatePdf(text, settings)
      downloadPdf(doc, filename)
    }
  }

  const clearAll = () => {
    setText('')
    setPreviewUrl(null)
    setShowPreview(false)
    pdfDocRef.current = null
    setFilename('document')
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const loadExample = () => {
    setText(PLACEHOLDER_TEXT)
    setPreviewUrl(null)
    setFilename('example-document')
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="app">
      <header className="header">
        <h1>CyberPDF</h1>
        <p className="subtitle">Convert text & Markdown into cyberpunk PDFs</p>
      </header>

      <main className="main">
        <div className="editor-section">
          <div className="editor-header">
            <div className="editor-title">
              <span>Editor</span>
              <div className="stats">
                <span>{stats.characters} chars</span>
                <span>{stats.words} words</span>
                <span>{stats.lines} lines</span>
              </div>
            </div>
            <div className="editor-actions">
              <button
                className="btn-ghost"
                onClick={loadExample}
                aria-label="Load example text"
              >
                Example
              </button>
              {text && (
                <button
                  className="btn-ghost"
                  onClick={clearAll}
                  aria-label="Clear all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div
            className={`textarea-wrapper ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Start typing or drop a .txt / .md file here..."
              spellCheck={false}
              aria-label="Text input"
            />
            {isDragging && (
              <div className="drop-overlay">
                <span>Drop file here</span>
              </div>
            )}
          </div>

          <div className="file-input-row">
            <label className="file-label">
              <input
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileSelect}
                hidden
              />
              <span>Upload .txt or .md</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Settings</h2>

          <div className="settings-grid">
            <div className="setting-group">
              <label className="setting-label">Filename</label>
              <input
                type="text"
                className="input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="document"
                aria-label="PDF filename"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">Font</label>
              <select
                className="select"
                value={settings.font}
                onChange={(e) => updateSetting('font', e.target.value)}
                aria-label="Font family"
              >
                <option value="sans">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="mono">Monospace</option>
                <option value="orbitron">Orbitron (Cyber)</option>
                <option value="playfair">Playfair Display (Elegant)</option>
                <option value="roboto">Roboto (Modern)</option>
                <option value="poppins">Poppins (Rounded)</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Size</label>
              <select
                className="select"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', e.target.value)}
                aria-label="Font size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Page Size</label>
              <select
                className="select"
                value={settings.pageSize}
                onChange={(e) => updateSetting('pageSize', e.target.value)}
                aria-label="Page size"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Orientation</label>
              <select
                className="select"
                value={settings.orientation}
                onChange={(e) => updateSetting('orientation', e.target.value)}
                aria-label="Page orientation"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">PDF Theme</label>
              <div className="theme-options">
                {['light', 'dark', 'sepia'].map((t) => (
                  <button
                    key={t}
                    className={`theme-btn theme-${t} ${settings.theme === t ? 'active' : ''}`}
                    onClick={() => updateSetting('theme', t)}
                    aria-label={`${t} theme`}
                    aria-pressed={settings.theme === t}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group full-width">
              <label className="setting-label">Header Text</label>
              <input
                type="text"
                className="input"
                value={settings.headerText}
                onChange={(e) => updateSetting('headerText', e.target.value)}
                placeholder="Optional header text for each page..."
                aria-label="Header text"
              />
            </div>

            <div className="setting-group full-width">
              <div className="toggles">
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.enableMarkdown}
                    onChange={(e) => updateSetting('enableMarkdown', e.target.checked)}
                  />
                  <span>Markdown</span>
                </label>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.showPageNumbers}
                    onChange={(e) => updateSetting('showPageNumbers', e.target.checked)}
                  />
                  <span>Page numbers</span>
                </label>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.showLineNumbers}
                    onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
                  />
                  <span>Line numbers</span>
                </label>
              </div>
            </div>

            <div className="setting-group full-width">
              <div className="action-buttons">
                <button
                  className="btn-secondary"
                  onClick={generatePreview}
                  disabled={!text.trim() || isGenerating}
                  aria-label="Preview PDF"
                >
                  {isGenerating ? 'Generating...' : 'Preview'}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleDownload}
                  disabled={!text.trim()}
                  aria-label="Download PDF"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPreview && previewUrl && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>Preview — {settings.pageSize.toUpperCase()} {settings.orientation}</h3>
              <button
                className="close-btn"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                &times;
              </button>
            </div>
            <div className={`preview-frame-wrapper page-${settings.pageSize} ${settings.orientation === 'landscape' ? 'landscape' : ''}`}>
              <iframe
                src={previewUrl}
                title="PDF Preview"
                className="preview-iframe"
              />
            </div>
            <div className="preview-actions">
              <button
                className="btn-primary"
                onClick={handleDownload}
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <a
          href="https://github.com/tgmanu"
          target="_blank"
          rel="noopener noreferrer"
        >
          Coded by @tgmanu
        </a>
      </footer>
    </div>
  )
}
