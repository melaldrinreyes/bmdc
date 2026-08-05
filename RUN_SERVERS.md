# Running Frontend and Backend on Same Port

## Configuration Changes Made

Both the frontend and backend are now configured to run on **port 3000**:

- **Backend**: `http://localhost:3000` (Next.js API + static pages)
- **Frontend**: Vite development server with proxy to backend API

### How It Works

1. **Frontend (Vite) runs on port 3000** and serves the React app
2. **Backend (Next.js) runs on port 3000** as the API server
3. **Vite's proxy** automatically forwards `/api/*` requests to the backend while on localhost
4. API calls use relative paths (`/api`) which are proxied during development

## Running the Servers

### Option 1: Run Both Servers Together (Recommended)

#### On Windows (PowerShell):

```powershell
# Terminal 1 - Backend
cd Backend
npm run dev

# Terminal 2 - Frontend (in another PowerShell window)
cd Frontend
npm run dev
```

Both will run on **port 3000**:
- Backend listens on `http://localhost:3000`
- Frontend Vite dev server also on `http://localhost:3000` with API proxying

### Option 2: Using concurrently (Optional)

If you want to run both from one terminal, you can install `concurrently`:

```bash
npm install -g concurrently
```

Then from the root directory:

```bash
concurrently "cd Backend && npm run dev" "cd Frontend && npm run dev"
```

## Testing

1. Open browser to `http://localhost:3000`
2. The frontend will load from the Vite dev server
3. When you click "Browse Programs", the API call to `/trainees/me` will be proxied to the backend
4. You should see the programs list (after applying the mobile_app_access migration)

## Files Modified

1. **Backend/package.json** - Changed port from 3003 to 3000
2. **Backend/.env** - Changed `API_PORT` from 3003 to 3000
3. **Backend/next.config.js** - Updated localhost references from 3001/3002 to 3000
4. **Frontend/vite.config.ts** - Changed port to 3000 and added proxy configuration
5. **Frontend/src/services/api.ts** - Updated API base URL to use `/api` proxy during development

## Development Flow

- **Frontend changes**: Vite auto-refreshes on file save
- **Backend changes**: Next.js auto-refreshes on file save
- **API calls**: Use `/api/*` paths, automatically proxied to backend
- **No CORS issues**: Same port (3000) for both frontend and backend

## Production

In production, you can:
1. Build both frontend and backend separately
2. Use a reverse proxy (Nginx, Apache) to route requests
3. Or deploy them to the same Next.js instance (more complex setup)

## Troubleshooting

If you get "port already in use" error:

```bash
# Find and kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use lsof on macOS/Linux
lsof -i :3000
kill -9 <PID>
```

If API calls still go to 3003, check that:
1. `/api/*` requests are being proxied (check Vite dev server logs)
2. Refresh the page in the browser
3. Check browser DevTools Network tab - requests should show as being to `/api/...` not `http://localhost:3003`
