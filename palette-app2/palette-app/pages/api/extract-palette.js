export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageBase64, mimeType, count } = req.body

  if (!imageBase64 || !count) {
    return res.status(400).json({ error: 'Missing imageBase64 or count' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  const prompt = `Analyze this image and extract exactly ${count} dominant colors as a color palette.

Return ONLY a valid JSON array of ${count} hex color strings, sorted from most dominant to least dominant.
No explanation, no markdown, no extra text — just the raw JSON array.

Example format:
["#1a2b3c", "#d4e5f6", "#ff8833"]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    const rawText = await response.text()

    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      return res.status(500).json({ error: 'Claude API returned unexpected response: ' + rawText.slice(0, 120) })
    }

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || `Claude API error (${response.status})` })
    }

    const text = data.content?.[0]?.text || ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.status(500).json({ error: 'No color array found in response: ' + text.slice(0, 120) })
    const colors = JSON.parse(match[0])

    if (!Array.isArray(colors)) throw new Error('Invalid palette format')

    return res.status(200).json({ colors })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to extract palette' })
  }
}
