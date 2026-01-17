# Grimlock2 Dashboard

Modern React + TypeScript dashboard for visualizing AI agent audit trails.

## Tech Stack

- **Build Tool**: Vite 5
- **Framework**: React 18
- **Language**: TypeScript
- **Router**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Custom CSS
- **Date Formatting**: date-fns

## Quick Start

### Prerequisites

- Node.js 18+
- Grimlock2 backend API running

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

Visit **http://localhost:3000**

### Build for Production

```bash
# Build TypeScript + Bundle
pnpm run build

# Preview production build
pnpm run preview
```

## Configuration

### Environment Variables

Create `.env` (optional):

```bash
# API endpoint (defaults to http://localhost:8080/api/v1)
VITE_API_URL=http://localhost:8080/api/v1
```

### API Connection

The dashboard connects to the Grimlock2 backend API. Update `src/api.ts` if needed:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
```

## Features

- **Runs List**: Browse all agent runs with filters
- **Run Timeline**: Detailed event timeline view
- **Event Filtering**: Filter by event type, time range
- **Human Edit Diff**: Side-by-side comparison of AI vs human edits
- **User Statistics**: Event counts and metrics per user
- **Type Safety**: Full TypeScript coverage
- **Fast HMR**: Vite hot module reloading

## Deployment

### Automated Deployment with GitHub Actions (Vercel)

This project includes a GitHub Actions workflow that automatically deploys to Vercel on every push to `main` or `master` branch.

#### Setup Instructions

1. **Create a Vercel Account & Project**
   - Go to [vercel.com](https://vercel.com) and sign up
   - Import your GitHub repository or create a new project
   - Note your project settings

2. **Get Vercel Credentials**
   
   Install Vercel CLI locally:
   ```bash
   pnpm add -g vercel
   ```

   Login and link your project:
   ```bash
   vercel login
   vercel link
   ```

   This creates a `.vercel` directory with your project configuration.

3. **Get Vercel Token**
   
   Generate a token at: https://vercel.com/account/tokens
   - Create a new token
   - Copy the token value

4. **Add GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add the following secret:
   - `VERCEL_TOKEN`: Your Vercel token from step 3

5. **Commit and Push**
   
   The workflow will automatically trigger on push to `main`/`master` and deploy to Vercel.

#### Workflow Features

- ✅ Automatic deployment on push to main
- ✅ Preview deployments for pull requests
- ✅ Build verification before deployment
- ✅ Uses Vercel's production environment

#### Manual Deployment (Vercel CLI)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Static Hosting (Netlify, etc.)

```bash
pnpm run build
# Deploy the dist/ folder
```

### GCP Cloud Storage + CDN

```bash
pnpm run build
gsutil -m rsync -r dist/ gs://your-bucket/
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t grimlock-dashboard .
docker run -p 80:80 grimlock-dashboard
```

## Development

### Project Structure

```
dashboard/
├── src/
│   ├── main.tsx           # App entry point
│   ├── App.tsx            # Root component with routing
│   ├── types.ts           # TypeScript type definitions
│   ├── api.ts             # API client
│   ├── index.css          # Global styles
│   └── components/
│       ├── RunsList.tsx
│       ├── RunTimeline.tsx
│       ├── EventCard.tsx
│       ├── HumanEditDiff.tsx
│       └── UserStats.tsx
├── index.html             # HTML entry
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── package.json
```

### Available Scripts

```bash
pnpm run dev      # Start dev server with HMR
pnpm run build    # Build for production
pnpm run preview  # Preview production build
pnpm run lint     # Run ESLint
```

### Type Checking

TypeScript is checked during build:

```bash
pnpm run build  # Includes type checking
```

## API Integration

The dashboard expects these API endpoints:

- `GET /api/v1/runs` - List all runs
- `GET /api/v1/runs/:run_id` - Get run timeline
- `GET /api/v1/stats/user/:user_token_hash` - Get user stats

See `AGENTS.md` for complete API reference.

## Customization

### Changing Colors

Edit `src/index.css`:

```css
.badge-info {
  background-color: #dbeafe;  /* Change this */
  color: #1e40af;
}
```

### Adding New Pages

1. Create component in `src/components/`
2. Add route in `src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Add navigation link

### Custom Event Types

Add type in `src/types.ts`:

```typescript
export interface CustomEventData {
  field1: string;
  field2: number;
}
```

## Troubleshooting

### Dev server won't start

```bash
rm -rf node_modules .vite
pnpm install
pnpm run dev
```

### Build fails

```bash
# Check TypeScript errors
npx tsc --noEmit
```

### API connection issues

Check CORS settings on backend and verify `VITE_API_URL`.

## Performance

- **Dev Server**: 1-3s cold start
- **HMR**: 50-200ms updates
- **Production Build**: ~10-20s
- **Bundle Size**: ~150KB (gzipped)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
