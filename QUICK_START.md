# Quick Start Guide - Both Servers on Port 3000

## What Changed
✅ Backend now runs on **port 3000** instead of 3003
✅ Frontend now runs on **port 3000** with proxy to backend
✅ Both servers can run together without port conflicts

## How to Run

### Step 1: Open Two PowerShell/Terminal Windows

### Step 2: Start Backend (Terminal 1)
```powershell
cd Backend
npm run dev
```
Wait for: `ready - started server on 0.0.0.0:3000`

### Step 3: Start Frontend (Terminal 2)
```powershell
cd Frontend
npm run dev
```
Wait for: `Local: http://localhost:3000/`

### Step 4: Open Browser
Navigate to: **http://localhost:3000**

## That's It! 🎉

Both frontend and backend are now running on the same port (3000).

## Quick Check
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for API requests - they should show paths like `/api/auth/me` (not `http://localhost:3000/api/...`)

## Common Issues

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | Kill existing process: `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| Frontend won't load | Make sure Backend started first, then restart Frontend |
| API requests still going to 3003 | Clear browser cache (Ctrl+Shift+Delete) and restart |
| "WebSocket failed" message | Normal - app will still work. Not blocking |

## Next Steps

After verifying everything works:

1. **Apply the database migration** to enable `mobile_app_access` feature flag:
   ```bash
   psql "$DATABASE_URL" -f Backend/migrations/enable_mobile_app_access.sql
   ```

2. **Test the auto-logout fix**:
   - Login as trainee: `trainee1@bmdc.gov.ph` / `admin123`
   - Go to "My Applications" → "Browse Programs"
   - Should see programs list (NOT logged out)

## Files Changed

- `Backend/package.json` - Port 3000
- `Backend/.env` - `API_PORT=3000`
- `Backend/next.config.js` - CORS header updates
- `Frontend/vite.config.ts` - Port 3000 + proxy setup
- `Frontend/src/services/api.ts` - API URL configuration

See `SINGLE_PORT_SETUP.md` for detailed documentation.
