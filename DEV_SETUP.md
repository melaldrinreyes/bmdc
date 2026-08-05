# BMDC Development Setup Guide

## Quick Start

### Option 1: Automated (Windows Batch)
```bash
# Run the startup script
.\START_SERVERS.bat
```

This will:
- Start Backend (Next.js) on port 3003
- Start Frontend (Vite) on port 3001
- Open both in separate terminal windows

---

### Option 2: Manual Startup (Recommended)

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
# Backend will run on http://localhost:3003
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
# Frontend will run on http://localhost:3001
```

---

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| **Frontend (Vite)** | 3001 | http://localhost:3001 |
| **Backend (Next.js)** | 3003 | http://localhost:3003 |
| **API Proxy** | 3001 → 3003 | Automatic via Vite proxy |

---

## Frontend Vite Configuration

**File:** `Frontend/vite.config.ts`

```typescript
server: {
  port: 3001,
  hmr: {
    protocol: 'ws',
    host: 'localhost',
    port: 3001,  // Hot Module Reload on same port
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3003',
      changeOrigin: true,
      ws: true,
    },
  },
}
```

**Key Points:**
- HMR (Hot Module Reload) uses WebSocket on port 3001
- API requests are proxied to Backend on port 3003
- This avoids CORS issues in development

---

## Backend Next.js Configuration

**File:** `Backend/next.config.js`

```javascript
// Runs on port 3003 by default
// Set via npm script: "dev": "next dev -p 3003"
```

---

## Troubleshooting

### Issue: WebSocket connection failed to `ws://localhost:3000`

**Cause:** Stale Vite dev server or browser cache

**Solution:**
```bash
# Kill all Node processes
taskkill /IM node.exe /F

# Clear browser cache (Ctrl+Shift+Del in Chrome/Firefox)

# Restart servers
npm run dev
```

### Issue: Cannot connect to backend API

**Cause:** Backend not running on port 3003

**Solution:**
```bash
# Check if port 3003 is in use
netstat -ano | findstr :3003

# Start backend
cd Backend
npm run dev
```

### Issue: Port already in use

**Solution - Kill process on specific port:**
```bash
# For port 3001
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3001') do taskkill /PID %a /F

# For port 3003
for /f "tokens=5" %a in ('netstat -ano ^| findstr :3003') do taskkill /PID %a /F
```

### Issue: Blank page after login

**Possible causes:**
1. Backend not running
2. API proxy misconfigured
3. Authentication token invalid

**Debug:**
1. Check browser DevTools → Network tab
2. Verify API calls go to `http://localhost:3001/api/...`
3. Check Backend logs for errors

---

## Development Workflow

### 1. **Frontend Development**
```bash
cd Frontend
npm run dev
# Browser auto-refreshes on file changes
```

### 2. **Backend Development**
```bash
cd Backend
npm run dev
# Server auto-restarts on TypeScript changes
```

### 3. **Building for Production**

Frontend:
```bash
cd Frontend
npm run build
# Output: Frontend/build/
```

Backend:
```bash
cd Backend
npm run build
# Output: Backend/.next/
```

---

## Environment Variables

### Frontend (`Frontend/.env.local`)
```env
# Usually not needed - API proxied through Vite
# VITE_API_URL=http://localhost:3001/api
```

### Backend (`Backend/.env`)
```env
# Database
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# API Port
API_PORT=3003

# JWT Secret
JWT_SECRET=your_secret_here
```

---

## Common Commands

### Clean Install
```bash
# Frontend
cd Frontend
rm -r node_modules package-lock.json
npm install

# Backend
cd Backend
rm -r node_modules package-lock.json
npm install
```

### Type Checking
```bash
# Frontend
npm run type-check

# Backend (run in next build)
npm run build
```

### Testing
```bash
# Frontend
npm test
npm run test:coverage

# Backend
npm test
```

---

## Performance Tips

1. **Disable browser extensions** that interfere with WebSocket
2. **Use Chrome DevTools** for frontend debugging
3. **Keep console open** to see API errors
4. **Restart servers** if things get weird
5. **Clear node_modules** if dependencies seem broken

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Browser (localhost:3001)        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Frontend (React/Vite)          │   │
│  │  - Pages, Components            │   │
│  │  - State Management             │   │
│  │  - WebSocket: port 3001 (HMR)   │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/WebSocket
               │ /api/* → :3003
               │
┌──────────────▼──────────────────────────┐
│    Backend (localhost:3003)             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Next.js (TypeScript)           │   │
│  │  - API Routes                   │   │
│  │  - Database Access              │   │
│  │  - Authentication               │   │
│  └─────────────────────────────────┘   │
│           │                             │
│           ▼                             │
│  ┌─────────────────────────────────┐   │
│  │  Supabase (PostgreSQL)          │   │
│  │  - Data Storage                 │   │
│  │  - Authentication (optional)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## File Structure

```
.
├── Frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Utilities
│   ├── vite.config.ts       # Vite configuration
│   ├── package.json
│   └── tsconfig.json
│
├── Backend/
│   ├── src/
│   │   ├── app/
│   │   │   └── api/         # API routes
│   │   ├── lib/             # Libraries
│   │   ├── middleware/      # Custom middleware
│   │   └── services/        # Business logic
│   ├── next.config.js       # Next.js configuration
│   ├── package.json
│   └── tsconfig.json
│
├── START_SERVERS.bat        # Startup script
├── DEV_SETUP.md            # This file
└── README.md               # Project readme
```

---

## Next Steps

1. ✅ Install dependencies: `npm install` (both Frontend & Backend)
2. ✅ Set up environment variables
3. ✅ Start both servers using one of the options above
4. ✅ Open http://localhost:3001 in browser
5. ✅ Log in and start developing!

---

## Support

For issues:
1. Check git log for recent changes
2. Review error messages in DevTools console
3. Check server terminal outputs
4. Restart all Node processes and try again
