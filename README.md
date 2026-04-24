# GreyScale Analyser

Browser-based textile colour shift and greyscale analysis tool. The app compares before/after fabric photos and produces visual greyscale output, colour metrics, charts, and matrix views for observer review.

## Features

- Upload before and after textile photos.
- Convert both photos to greyscale in the browser.
- Compare average RGB, value/luminosity, LAB, Delta E CIE76 estimate, and estimated greyscale grade.
- View RGB radar chart, histogram, change matrix, ISO greyscale reference, and colour value reference.
- Open the analysis workspace in a fullscreen zoomable canvas.
- Add observer grade and notes for manual validation.
- Runs fully client-side. Uploaded photos are not sent to a server.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Lucide React
- Canvas API

## Requirements

- Node.js `>=20.19.0`
- npm

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Vercel Deploy

This project does not need environment variables for the current MVP.

Recommended Vercel settings:

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Deploy preview with Vercel CLI:

```bash
npx --yes vercel@52.0.0
```

Deploy production:

```bash
npx --yes vercel@52.0.0 --prod
```

## Privacy Note

The current MVP processes image data locally in the browser using Canvas API. There is no backend upload, database storage, authentication, or third-party analysis service.
