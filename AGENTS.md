# Grimlock2 Dashboard - Technical Documentation

## Overview

The Grimlock2 Dashboard is a modern, type-safe React application for visualizing AI agent audit trails. Built with Vite + TypeScript for optimal developer experience and performance.

---

## Architecture

```
┌─────────────────┐
│  React Router   │  Navigation & routing
└────────┬────────┘
         │
    ┌────┴────┐
    │  Pages  │  RunsList, RunTimeline, UserStats
    └────┬────┘
         │
    ┌────┴────────┐
    │ Components  │  EventCard, HumanEditDiff
    └────┬────────┘
         │
    ┌────┴────┐
    │   API   │  Axios client
    └────┬────┘
         │
    ┌────┴───────────┐
    │ Backend API    │  http://localhost:8080/api/v1
    └────────────────┘
```

---

## Technology Stack

### Build & Dev Tools

- **Vite 5.0+**: Ultra-fast build tool with native ESM
- **TypeScript 5.2+**: Static type checking
- **ESLint**: Code quality and consistency

### Runtime

- **React 18.2**: UI framework with concurrent features
- **React Router v6**: Client-side routing
- **Axios 1.6+**: HTTP client with interceptors
- **date-fns 3.0+**: Date formatting and manipulation

### Performance Benefits

| Metric | Vite | CRA | Improvement |
|--------|------|-----|-------------|
| Cold Start | 1-3s | 10-30s | **10x faster** |
| HMR | 50-200ms | 1-2s | **10x faster** |
| Build Time | 10-20s | 60-90s | **5x faster** |
| Bundle Size | ~150KB | ~500KB | **3x smaller** |

---

## Project Structure

```
dashboard/
├── public/              # Static assets (none currently)
├── src/
│   ├── main.tsx         # Application entry point
│   ├── App.tsx          # Root component with routing
│   ├── types.ts         # TypeScript type definitions
│   ├── api.ts           # API client and functions
│   ├── index.css        # Global styles
│   └── components/
│       ├── RunsList.tsx       # Runs list page
│       ├── RunTimeline.tsx    # Run detail/timeline page
│       ├── EventCard.tsx      # Individual event display
│       ├── HumanEditDiff.tsx  # Diff viewer for human edits
│       └── UserStats.tsx      # User statistics page
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tsconfig.node.json   # TypeScript for Node.js (Vite config)
├── package.json         # Dependencies and scripts
└── .gitignore
```

---

## Type System

### Core Types

```typescript
// src/types.ts

export interface Event {
  id: number;
  event_id: string;
  tenant_id: string;
  user_token_hash: string;
  user_id: string | null;
  run_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  sequence_num: number | null;
  created_at: string;
}

export interface Run {
  run_id: string;
  user_token_hash: string;
  user_id: string | null;
  first_event_at: string;
  last_event_at: string;
  event_count: number;
  event_types: string[];
}

export interface UserStats {
  user_token_hash: string;
  user_id: string | null;
  total_events: number;
  total_runs: number;
  tool_calls: number;
  human_edits: number;
  custom_events: number;
}
```

### Event Data Types

```typescript
export interface HumanEditData {
  original: string;
  edited: string;
  editor_id: string;
  edited_at?: string;
  context?: Record<string, any>;
}

export interface ToolCallData {
  tool_call_id?: string;
  tool_name: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  duration_ms?: number;
  status?: 'success' | 'error';
  error?: string;
}

export interface AgentStepData {
  step_name: string;
  inputs?: any;
  outputs?: any;
}

export interface NetworkCallData {
  method: string;
  url: string;
  status_code?: number;
  duration_ms?: number;
  request_headers?: Record<string, string>;
  response_headers?: Record<string, string>;
}
```

---

## API Client

### Configuration

```typescript
// src/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### API Functions

```typescript
export const getRuns = async (
  userTokenHash: string = '', 
  limit: number = 50
): Promise<Run[]> => {
  const params = new URLSearchParams();
  if (userTokenHash) params.append('user_token_hash', userTokenHash);
  if (limit) params.append('limit', limit.toString());
  
  const response = await api.get<Run[]>(`/runs?${params.toString()}`);
  return response.data;
};

export const getRunTimeline = async (runId: string): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/runs/${runId}`);
  return response.data;
};

export const getUserStats = async (userTokenHash: string): Promise<UserStats> => {
  const response = await api.get<UserStats>(`/stats/user/${userTokenHash}`);
  return response.data;
};
```

---

## Components

### App Component

```typescript
// src/App.tsx
function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <h1>⚡ Grimlock2 Dashboard</h1>
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<RunsList />} />
          <Route path="/runs/:runId" element={<RunTimeline />} />
          <Route path="/users/:userTokenHash" element={<UserStats />} />
        </Routes>
      </div>
    </Router>
  );
}
```

### RunsList Component

**Features**:
- Loads all runs from API
- User token hash filtering
- Click to navigate to run detail
- Displays event counts and types

**Key Implementation**:
```typescript
const [runs, setRuns] = useState<Run[]>([]);
const [userFilter, setUserFilter] = useState('');

useEffect(() => {
  loadRuns();
}, [userFilter]);

const loadRuns = async () => {
  const data = await getRuns(userFilter);
  setRuns(data || []);
};
```

### RunTimeline Component

**Features**:
- Displays chronological event list
- Event type filtering
- Expandable event cards
- Proper timestamp formatting

**Key Implementation**:
```typescript
const [events, setEvents] = useState<Event[]>([]);
const [eventTypeFilter, setEventTypeFilter] = useState('');

const filteredEvents = eventTypeFilter
  ? events.filter(e => e.event_type === eventTypeFilter)
  : events;
```

### EventCard Component

**Features**:
- Collapsible event details
- Event type badges with colors
- Special rendering for different event types
- JSON viewer for data

**Event Type Rendering**:
```typescript
switch (event.event_type) {
  case 'HUMAN_EDIT':
    return <HumanEditDiff data={eventData} />;
  
  case 'TOOL_CALL_START':
  case 'TOOL_CALL_END':
    return <ToolCallDisplay data={eventData} />;
  
  case 'AGENT_STEP':
    return <AgentStepDisplay data={eventData} />;
  
  default:
    return <JSONViewer data={eventData} />;
}
```

### HumanEditDiff Component

**Features**:
- Side-by-side diff view
- Original (AI) vs Edited (Human) comparison
- Editor information
- Edit context display

**Layout**:
```css
.diff-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
```

### UserStats Component

**Features**:
- Displays user metrics
- Color-coded stat cards
- Responsive grid layout

**Stats Display**:
```typescript
<StatCard label="Total Events" value={stats.total_events} color="#2563eb" />
<StatCard label="Tool Calls" value={stats.tool_calls} color="#0891b2" />
<StatCard label="Human Edits" value={stats.human_edits} color="#ea580c" />
```

---

## Styling

### CSS Architecture

- **Global Styles**: `src/index.css` - Reset, typography, utilities
- **Component Styles**: Inline styles for dynamic values
- **CSS Classes**: Reusable utility classes

### Key CSS Classes

```css
/* Buttons */
.button { padding: 0.5rem 1rem; border-radius: 4px; }
.button-primary { background: #2563eb; color: white; }
.button-secondary { background: #e5e7eb; color: #374151; }

/* Badges */
.badge { padding: 0.25rem 0.75rem; border-radius: 9999px; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-error { background: #fee2e2; color: #991b1b; }
.badge-info { background: #dbeafe; color: #1e40af; }

/* Timeline */
.timeline { position: relative; padding-left: 2rem; }
.timeline::before { /* Vertical line */ }
.timeline-dot { /* Event markers */ }

/* Cards */
.card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
```

---

## Routing

### Route Configuration

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `RunsList` | Home page with all runs |
| `/runs/:runId` | `RunTimeline` | Detailed timeline for a run |
| `/users/:userTokenHash` | `UserStats` | Statistics for a user |

### Navigation

```typescript
import { useNavigate, useParams } from 'react-router-dom';

const navigate = useNavigate();
const { runId } = useParams<{ runId: string }>();

// Navigate programmatically
navigate(`/runs/${runId}`);
```

---

## State Management

### Component State

Uses React hooks for local state:

```typescript
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Data Flow

1. Component mounts → `useEffect` triggers
2. Call API function → Update loading state
3. Receive data → Update state
4. Re-render with data

### Error Handling

```typescript
try {
  setLoading(true);
  setError(null);
  const data = await getRuns();
  setRuns(data);
} catch (err) {
  setError('Failed to load: ' + (err as Error).message);
} finally {
  setLoading(false);
}
```

---

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### Features

- **React Plugin**: Fast Refresh support
- **Proxy**: API requests proxied to backend
- **Port**: Dev server on 3000

---

## TypeScript Configuration

### App Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Benefits of Strict Mode

- ✅ Catch type errors at compile time
- ✅ Better IDE autocomplete
- ✅ Safer refactoring
- ✅ Self-documenting code

---

## Build & Deployment

### Development Build

```bash
npm run dev
# Starts dev server with HMR
# Source maps enabled
# Fast compilation
```

### Production Build

```bash
npm run build
# 1. TypeScript compilation (type checking)
# 2. Vite bundling and minification
# 3. Output to dist/ folder
```

### Build Output

```
dist/
├── index.html           # Entry HTML
├── assets/
│   ├── index-[hash].js  # Bundled JS (code split)
│   └── index-[hash].css # Bundled CSS
└── ...
```

### Deployment Options

**1. Static Hosting**:
- Vercel: `vercel deploy`
- Netlify: Drag-and-drop `dist/`
- GitHub Pages: Copy `dist/` to gh-pages branch

**2. Cloud Storage**:
```bash
# GCP
gsutil -m rsync -r dist/ gs://bucket/

# AWS
aws s3 sync dist/ s3://bucket/
```

**3. Docker**:
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html
```

---

## Performance Optimizations

### Code Splitting

Vite automatically code splits:
- Each route in separate chunk
- Vendor libraries in separate chunk
- Lazy loading for routes

### Bundle Analysis

```bash
npm run build
# Check dist/ folder sizes
```

### Performance Tips

1. **Lazy Load Routes**:
   ```typescript
   const RunTimeline = lazy(() => import('./components/RunTimeline'));
   ```

2. **Memoize Expensive Computations**:
   ```typescript
   const filteredEvents = useMemo(
     () => events.filter(e => e.event_type === filter),
     [events, filter]
   );
   ```

3. **Virtualize Long Lists**:
   For 1000+ events, use react-window

---

## Testing

### Type Checking

```bash
npx tsc --noEmit
```

### Manual Testing Checklist

- [ ] Runs list loads and displays
- [ ] User filter works
- [ ] Click run navigates to timeline
- [ ] Events display correctly
- [ ] Human edit diff shows properly
- [ ] User stats page works
- [ ] Back navigation works
- [ ] Error states display

---

## Browser DevTools

### React DevTools

Install extension to:
- Inspect component tree
- View props and state
- Profile performance

### Network Tab

Check API calls:
- Request/response timing
- Response payloads
- Error responses

---

## Troubleshooting

### TypeScript Errors

```bash
# Check errors
npx tsc --noEmit

# Common fix: clear and reinstall
rm -rf node_modules
npm install
```

### Vite Cache Issues

```bash
rm -rf node_modules/.vite
npm run dev
```

### API Connection

1. Check backend is running: `curl http://localhost:8080/health`
2. Check CORS headers in browser console
3. Verify `VITE_API_URL` in `.env`

### Build Failures

```bash
# Clean build
rm -rf dist
npm run build
```

---

## Future Enhancements

Potential improvements:

- [ ] Real-time updates (WebSocket)
- [ ] Export runs to CSV/JSON
- [ ] Advanced filtering (date range, regex)
- [ ] Event search
- [ ] Saved filters/views
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Print-friendly views

---

## Contributing

### Adding a New Page

1. Create component in `src/components/`
2. Add route in `src/App.tsx`
3. Add navigation link
4. Add types to `src/types.ts`

### Adding a New Event Type

1. Add interface to `src/types.ts`
2. Add rendering case in `EventCard.tsx`
3. Add styling if needed

### Code Style

- Use TypeScript strict mode
- Use functional components with hooks
- Follow React best practices
- Use descriptive variable names
- Add comments for complex logic

---

## License

MIT
