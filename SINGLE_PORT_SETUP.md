# Single Port Setup (Port 3000) - Configuration Summary

## Overview
Both frontend and backend now run on the same port (`3000`) using a proxy-based architecture:
- **Frontend**: Vite development server on port 3000
- **Backend**: Next.js API server on port 3000
- **Proxy**: Vite proxies `/api/*` requests to backend while serving frontend

## Files Modified

### 1. Backend/package.json
**Changes**: Updated dev and start scripts to use port 3000
```json
"dev": "next dev -p 3000",
"start": "next start -p 3000",
```

### 2. Backend/.env
**Changes**: Updated API_PORT environment variable
```
API_PORT=3000
```

### 3. Backend/next.config.js
**Changes**: Updated CORS and CSP headers to reference localhost:3000
```javascript
// Development origin changed from localhost:3001 to localhost:3000
connect-src 'self' http://localhost:3000 ws://localhost:3000
```

### 4. Frontend/vite.config.ts
**Changes**: 
- Updated port from 3001 to 3000
- Added proxy configuration for `/api` and `/uploads` routes
```typescript
server: {
  port: 3000,
  hmr: {
    port: 3000,
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path,
      ws: true,
    },
    '/uploads': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path,
    },
  },
}
```

### 5. Frontend/src/services/api.ts
**Changes**: Updated API_BASE_URL to use proxy path in development
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api'  // In development, use proxy path (same port)
    : `${window.location.protocol}//${window.location.host}/api`  // In production, use same origin
);
```

## How It Works

### Development Mode (Single Terminal Approach)

```
┌─────────────────────────────────────┐
│    Browser: http://localhost:3000   │
└────────────┬────────────────────────┘
             │
    ┌────────▼─────────┐
    │  Vite Dev Server │
    │   (Port 3000)    │
    └────────┬─────────┘
             │
    ┌────────┴──────────────────┐
    │                           │
    │ Serves React App          │
    │ Proxies /api/* requests   │
    │ Proxies /uploads/* requests
    │                           │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │  Next.js Backend API      │
    │   (Port 3000)             │
    │                           │
    │ Handles /api/* routes     │
    │ Serves /uploads/* files   │
    └───────────────────────────┘
```

### Request Flow

1. **Frontend Page Load**
   - Browser requests `http://localhost:3000`
   - Vite dev server serves React app from `Frontend/src`
   - React app initializes

2. **API Request** (e.g., `/trainees/me`)
   - Frontend JavaScript makes request to `/api/trainees/me`
   - Vite proxy intercepts and forwards to `http://localhost:3000/api/trainees/me`
   - Backend Next.js receives request and responds
   - Proxy returns response to frontend

3. **Static Asset Request** (e.g., uploaded image)
   - Frontend requests `/uploads/{path}`
   - Vite proxy intercepts and forwards
   - Backend serves file or streams it

## Running the Servers

### Prerequisites
- Ensure port 3000 is not in use
- Both Backend and Frontend are in the same Git repository

### Starting Both Servers

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```
Output should show:
```
▲ Next.js 16.1.6
- Environments: .env
ready - started server on 0.0.0.0:3000
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
Output should show:
```
  VITE v6.4.2  ready in 123 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Accessing the Application
Open your browser to **`http://localhost:3000`**

## Key Benefits

✅ **Single Port**: Only one port (3000) to remember
✅ **No CORS Issues**: Proxy handles same-origin requests
✅ **Full Stack**: Both frontend and backend in one terminal session view
✅ **Hot Reload**: Both servers still have auto-reload capability
✅ **Development Friendly**: Simulates production-like routing
✅ **WebSocket Support**: Proxy includes WebSocket support for real-time features

## Testing the Setup

1. **Start both servers** (see above)
2. **Navigate to** `http://localhost:3000`
3. **Open DevTools** (F12) → Network tab
4. **Log in** as trainee: `trainee1@bmdc.gov.ph` / `admin123`
5. **Click** "My Applications" → "Browse Programs"
6. **Verify**: 
   - No 404 errors on `/api/trainees/me`
   - Network requests show as `/api/...` not `http://localhost:3000/api/...`
   - Programs list displays (after applying mobile_app_access migration)
   - **NOT** logged out automatically

## Troubleshooting

### Port 3000 Already in Use

**Windows (PowerShell):**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### Vite Not Starting

Check that Frontend/vite.config.ts has:
- `port: 3000`
- Proxy configuration for `/api` and `/uploads`

### API Requests Still Going to Wrong Port

1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart both servers
3. Check Vite output logs show proxy is active
4. Verify API_BASE_URL is `/api` in browser console:
   ```javascript
   // In browser DevTools console
   fetch('/api/auth/me').then(r => r.json()).then(console.log)
   ```

### "WebSocket connection failed"

This is normal if WebSocket features aren't needed. The app will continue to work.
The proxy has `ws: true` configured, so WebSocket support is available if needed later.

## Production Considerations

For production deployment:
1. Build frontend: `cd Frontend && npm run build`
2. Build backend: `cd Backend && npm run build`
3. Start backend production server: `npm start` (port 3000)
4. Serve built frontend through backend or use separate CDN
5. Use environment variables for different URLs if needed

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=  # Leave empty to use development proxy
```

### Backend (.env)
```
API_PORT=3000
FRONTEND_URL=http://localhost:3000  # Used in CORS headers for production
```

## Additional Notes

- The proxy configuration is only active during Vite dev server (`npm run dev`)
- Production builds won't have the proxy - they'll use full URLs
- Both servers still have independent hot reload/restart capabilities
- Console logs from both frontend and backend appear in their respective terminals
