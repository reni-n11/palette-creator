# Palette Creator

A web application for extracting color palettes from images using AI.

## Getting Started

The main application code is located in the `palette-app/` directory.

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the `palette-app` directory
3. Install dependencies: `npm install`
4. Copy `.env.local.example` to `.env.local` and add your API keys
5. Run the development server: `npm run dev`

## Usage

Upload an image to extract a color palette using AI-powered analysis.

## API

The app uses Anthropic's Claude API for color extraction. Make sure to set your `ANTHROPIC_API_KEY` in `.env.local`.