# Deployment

This project is a Vite static app and can be deployed to Vercel without server-side configuration.

## Vercel settings

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: `>=20.19.0`

## CLI deploy

Preview deployment:

```bash
npx --yes vercel@52.0.0
```

Production deployment:

```bash
npx --yes vercel@52.0.0 --prod
```

The app runs fully in the browser. No environment variables are required for the current MVP.
