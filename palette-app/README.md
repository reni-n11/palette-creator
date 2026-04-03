# ◈ Palette — AI Color Extractor

Extract beautiful color palettes from any image using Claude AI.

## Deploy on Vercel

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Add environment variable:
   - `ANTHROPIC_API_KEY` → your Claude API key
4. Deploy

## Local development

```bash
npm install
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Upload any PNG, JPG, or WEBP image
- Choose 3–12 colors to extract
- AI-powered extraction via Claude claude-opus-4-5
- Click any swatch or chip to copy the hex code
- Warm/cool tone indicator
- Dark mode support
