# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview
LASCMMG Tournament Management System - A full-stack JavaScript application for managing billiards tournaments.

**Tech Stack:**
- **Backend**: Node.js/Express with SQLite (better-sqlite3), Redis caching, JWT auth, CSRF protection, Socket.io for real-time notifications
- **Frontend**: React + Vite with Tailwind CSS, React Router, Formik/Yup forms, Socket.io client, PWA support
- **Security**: Helmet CSP, XSS protection, rate limiting, honeypot fields, signed cookies

## Repository Structure
```
lascmmg/
├── backend/               # Express server (no separate package.json)
│   ├── server.js         # Main entry point
│   ├── lib/              # Core libraries
│   │   ├── db/           # Database and Redis clients
│   │   ├── middleware/   # Express middleware (CSRF, honeypot, error handlers)
│   │   ├── services/     # Business logic services
│   │   ├── logger/       # Logging configuration
│   │   └── performance/  # Performance monitoring
│   └── routes/           # API route handlers
├── frontend-react/       # React SPA (separate package.json)
│   ├── src/             # React source code
│   ├── public/          # Static assets, PWA manifest
│   └── package.json     # Frontend dependencies
├── scripts/             # Utility scripts
│   ├── generate-keys.js
│   ├── health-check.js
│   └── security-audit.js
└── package.json         # Root dependencies (backend + dev tools)
```

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm or pnpm package manager
- Redis server (local or Docker)
- SQLite3 (comes with better-sqlite3)

## Installation

### Install all dependencies:
```bash
# Root dependencies (backend + shared tools)
npm install

# Frontend dependencies
cd frontend-react && npm install
```

## Environment Configuration

### Backend Configuration
Create `.env` in the root directory (or `backend/.env`):

```env
# Server
PORT=3000
NODE_ENV=development

# CORS (comma-separated origins)
CORS_ORIGIN=http://localhost:5173

# Security Secrets (generate with: node scripts/generate-keys.js)
JWT_SECRET=<64+ character random string>
COOKIE_SECRET=<64+ character random string>
CSRF_SECRET=<32+ character random string>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Database
DB_PATH=./backend/data/lascmmg.db
DB_BACKUP_PATH=./backend/backups/

# Redis (optional in dev)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
QUERY_SLOW_THRESHOLD_MS=100
```

### Frontend Configuration
Create `frontend-react/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=LASCMMG
VITE_ENV=development
VITE_ENABLE_PWA=true
```

## Common Development Commands

### Generate Security Keys
```bash
# Generate all required keys
npm run generate-keys

# Or use the script directly
node scripts/generate-keys.js all
```

### Run Development Servers

**Option 1: Concurrent (single terminal)**
```bash
npm run dev:full
```

**Option 2: Separate terminals**
```bash
# Terminal 1 - Backend
npm run dev
# Or directly: nodemon backend/server.js

# Terminal 2 - Frontend
cd frontend-react && npm run dev
```

### Build Commands
```bash
# Build frontend for production
npm run frontend:build

# No build needed for backend (plain Node.js)
```

### Linting & Formatting
```bash
# Lint entire project
npm run lint

# Fix linting issues
npm run lint:fix

# Format with Prettier
npm run format

# Frontend-specific linting
npm run frontend:lint
npm run frontend:lint:fix
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Test coverage
npm run test:coverage

# Frontend tests
cd frontend-react && npm test

# E2E tests (Cypress)
cd frontend-react && npm run cypress:open
```

### Database Management
```bash
# Setup database (run migrations)
npm run setup:db

# Database backup (via script)
node scripts/backup-manager.js create

# Health check
npm run health-check
```

## Key Architecture Patterns

### Backend Architecture
- **Entry Point**: `backend/server.js`
- **API Routes**:
  - `/api` - Authentication endpoints
  - `/api/tournaments` - Tournament management
  - `/api/players` - Player management
  - `/api/scores` - Score tracking
  - `/api/system` - System/security endpoints
  - `/api/admin` - Admin operations
  - `/api/admin/backup` - Backup management
  - `/api/admin/performance` - Performance monitoring
  - `/api/users` - User management
  - `/api/csrf-token` - CSRF token endpoint
  - `/ping` - Health check endpoint

### Security Implementation
- **CSRF Protection**: Token-based with cookie validation
- **Rate Limiting**: General API (100 req/15min) + stricter login limits (10 req/15min)
- **XSS Protection**: xss-clean middleware
- **Helmet**: CSP with per-request nonces via X-Request-Id
- **Honeypot**: Bot detection on admin pages
- **Cookies**: Signed, httpOnly, secure in production

### Real-time Features
- Socket.io server initialized in `server.js`
- Notification service (`lib/services/notificationService`)
- Client connects via `VITE_SOCKET_URL`

### Data Layer
- **SQLite**: Primary database via better-sqlite3
- **Redis**: Caching and session storage
- **Migrations**: Auto-applied via `lib/db/db-init`

## Production Deployment

### Build & Deploy Steps
1. **Build frontend**:
   ```bash
   cd frontend-react && npm run build
   ```

2. **Set production environment**:
   ```bash
   NODE_ENV=production
   ```

3. **Configure production secrets** (use strong, unique values)

4. **Run with process manager**:
   ```bash
   # Using PM2
   pm2 start backend/server.js --name lascmmg

   # Or directly
   NODE_ENV=production node backend/server.js
   ```

5. **Health check**:
   ```bash
   curl http://localhost:3000/ping
   ```

### Production Checklist
- [ ] HTTPS termination at reverse proxy
- [ ] All secrets are strong and unique
- [ ] Redis configured with authentication
- [ ] Database backups scheduled
- [ ] Logs properly configured
- [ ] Rate limiting tuned for production
- [ ] CORS_ORIGIN set to production domain

## CSRF Implementation Example

```javascript
// Frontend: Fetch CSRF token and make authenticated request
async function makeAuthenticatedRequest(endpoint, data) {
  // Get CSRF token
  const tokenResponse = await fetch('http://localhost:3000/api/csrf-token', {
    credentials: 'include'
  });
  const { csrfToken } = await tokenResponse.json();

  // Make authenticated request
  return fetch(`http://localhost:3000/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });
}
```

## Troubleshooting

### Common Issues

**CORS Errors**
- Verify `CORS_ORIGIN` includes your frontend URL
- Restart server after changing environment variables

**401/403 on POST/PUT/PATCH**
- Ensure CSRF token is fetched and included in `X-CSRF-Token` header
- Include `credentials: 'include'` in fetch requests

**Redis Connection Failed**
- Start Redis: `docker run -d --name redis -p 6379:6379 redis:7-alpine`
- Or install locally: `sudo apt install redis-server`

**Database Issues**
- Ensure `backend/data/` directory exists
- Run migrations: `npm run setup:db`

**Static Assets 404**
- Frontend build output should align with backend static mounts
- Check paths in `backend/server.js` static middleware

## Quick Redis Setup (Docker)
```bash
# Start Redis container
docker run -d --name lascmmg-redis -p 6379:6379 redis:7-alpine

# Stop Redis
docker stop lascmmg-redis

# Remove container
docker rm lascmmg-redis
```

## Testing Strategy

### Unit Tests
- Backend: Tests in `backend/tests/unit/`
- Frontend: Vitest with React Testing Library

### Integration Tests
- Backend: `backend/tests/integration/`
- Use test database and mock Redis

### E2E Tests
- Cypress configured in `frontend-react/`
- Run with: `cd frontend-react && npm run test:e2e`

## Security Notes

### Generate Strong Secrets
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using the provided script
node scripts/generate-keys.js
```

### Production Security
- Always run behind HTTPS (nginx/Apache reverse proxy)
- Use environment variables or secrets manager for sensitive data
- Enable all security headers in production
- Regularly update dependencies
- Monitor rate limiting and adjust as needed
- Review audit logs regularly

## Development Workflow

1. **Start dependencies**: Redis (if using)
2. **Install packages**: `npm install && cd frontend-react && npm install`
3. **Setup environment**: Copy `.env.example` files and configure
4. **Generate keys**: `npm run generate-keys`
5. **Setup database**: `npm run setup:db`
6. **Start dev servers**: `npm run dev:full`
7. **Access application**: http://localhost:5173

## API Documentation
API routes follow RESTful conventions. Key endpoints:

- `GET /ping` - Health check
- `POST /api/login` - User authentication
- `GET /api/csrf-token` - Get CSRF token
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/players` - List players
- `POST /api/scores` - Submit scores

All state-changing requests require:
- Valid CSRF token in `X-CSRF-Token` header
- Authentication cookie
- Proper Content-Type header
