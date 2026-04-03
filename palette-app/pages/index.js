import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const COUNT_OPTIONS = [3, 4, 5, 6, 8, 10, 12]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function warmth([r, , b]) {
  return r * 1.5 - b * 0.8
}

export default function Home() {
  const [image, setImage] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [count, setCount] = useState(6)
  const [palette, setPalette] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    setPalette([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setImage(dataUrl)
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setMimeType(file.type)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const extract = useCallback(async (b64 = imageBase64, mt = mimeType, c = count) => {
    if (!b64) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/extract-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mimeType: mt, count: c }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setPalette(data.colors)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [imageBase64, mimeType, count])

  const handleCountChange = (n) => {
    setCount(n)
    if (imageBase64) extract(imageBase64, mimeType, n)
  }

  const copy = (hex) => {
    navigator.clipboard.writeText(hex).catch(() => {})
    setCopied(hex)
    setTimeout(() => setCopied(null), 2000)
  }

  const reset = () => {
    setImage(null)
    setImageBase64(null)
    setPalette([])
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const warmthTotal = palette.reduce((s, h) => s + Math.max(0, warmth(hexToRgb(h))), 0)
  const coolTotal = palette.reduce((s, h) => s + Math.max(0, -warmth(hexToRgb(h))), 0)
  const total = warmthTotal + coolTotal || 1
  const warmPct = Math.round((warmthTotal / total) * 100)

  return (
    <>
      <Head>
        <title>Palette · Color Extractor</title>
        <meta name="description" content="Extract beautiful color palettes from any image using AI" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>" />
      </Head>

      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.logo}>◈</span>
          <h1 className={styles.title}>palette</h1>
          <p className={styles.subtitle}>AI color extraction</p>
        </header>

        {!image ? (
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <span className={styles.dropIcon}>◈</span>
            <p className={styles.dropTitle}>Пусни изображение тук</p>
            <p className={styles.dropSub}>или натисни за избор · PNG, JPG, WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => processFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className={styles.workspace}>
            <img src={image} alt="uploaded" className={styles.preview} />

            <div className={styles.controls}>
              <div>
                <p className={styles.ctrlLabel}>Брой цветове</p>
                <div className={styles.countRow}>
                  {COUNT_OPTIONS.map(n => (
                    <button
                      key={n}
                      className={`${styles.countBtn} ${n === count ? styles.active : ''}`}
                      onClick={() => handleCountChange(n)}
                      disabled={loading}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {!palette.length && !loading && !error && (
                <button className={styles.extractBtn} onClick={() => extract()}>
                  Извлечи палитра →
                </button>
              )}
            </div>

            {loading && (
              <div className={styles.loadingRow}>
                <span className={styles.spinner} />
                <span className={styles.loadingText}>анализиране с Claude…</span>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <span>⚠ {error}</span>
                <button onClick={() => extract()} className={styles.retryBtn}>повтори</button>
              </div>
            )}

            {palette.length > 0 && !loading && (
              <div className={styles.paletteSection}>
                <p className={styles.paletteLabel}>Извлечена палитра</p>

                <div className={styles.swatches}>
                  {palette.map((hex, i) => (
                    <div
                      key={i}
                      className={styles.swatch}
                      style={{ background: hex }}
                      onClick={() => copy(hex)}
                      title={hex}
                    >
                      <div className={styles.swatchInfo}>{hex}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.hexRow}>
                  {palette.map((hex, i) => (
                    <div key={i} className={styles.hexChip} onClick={() => copy(hex)}>
                      <div className={styles.hexDot} style={{ background: hex }} />
                      <span>{hex.toUpperCase()}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.moodBar}>
                  <span className={styles.moodLabel}>Топлина</span>
                  <div className={styles.moodSeg} style={{ background: '#d4866a', width: warmPct + '%' }} />
                  <div className={styles.moodSeg} style={{ background: '#6a99d4', width: (100 - warmPct) + '%' }} />
                </div>
              </div>
            )}

            <button className={styles.resetBtn} onClick={reset}>← ново изображение</button>
          </div>
        )}

        {copied && (
          <div className={styles.toast}>{copied} скопирано</div>
        )}
      </main>
    </>
  )
}
