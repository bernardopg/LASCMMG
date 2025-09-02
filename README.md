# LASCMMG — Tournament Management System

LASCMMG is a full-stack JavaScript application for managing billiards tournaments with real-time updates, comprehensive security, and modern web technologies.

![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-green)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![PWA](https://img.shields.io/badge/PWA-enabled-brightgreen)

## 🎱 Features

- **Tournament Management**: Complete tournament lifecycle from creation to completion
- **Player Management**: Registration, profiles, and statistics tracking
- **Real-time Updates**: Live scoring and notifications via Socket.io
- **Bracket Generation**: Automatic match scheduling and bracket creation
- **Leaderboards**: Dynamic ranking and performance tracking
- **Admin Dashboard**: Comprehensive tools for tournament administrators
- **Security First**: JWT authentication, CSRF protection, rate limiting
- **PWA Support**: Installable, offline-capable progressive web app
- **Audit Logging**: Complete activity tracking and compliance features
- **Performance Monitoring**: Built-in metrics and slow query detection

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express.js
- **Database**: SQLite (via better-sqlite3) with automated migrations
- **Caching**: Redis for sessions and performance optimization
- **Authentication**: JWT with secure httpOnly cookies
- **Real-time**: Socket.io for WebSocket communications
- **Security**: Helmet CSP, CSRF tokens, XSS protection, rate limiting

### Frontend
- **Framework**: React 19 with Vite for lightning-fast builds
- **Styling**: Tailwind CSS v4 for modern, responsive design
- **Routing**: React Router v7 for SPA navigation
- **Forms**: Formik with Yup validation
- **Icons**: Lucide React and React Icons
- **Charts**: Chart.js with React wrapper
- **PWA**: Service worker with offline support

### DevOps & Testing
- **Linting**: ESLint with security and React plugins
- **Formatting**: Prettier with consistent code style
- **Testing**: Vitest, React Testing Library, Cypress E2E
- **Development**: Nodemon for hot reloading
- **Production**: PM2 process management support

## 📋 Prerequisites

- **Node.js** 18+ LTS (v20 recommended)
- **npm** or **pnpm** package manager
- **Redis** server (local or Docker)
- **SQLite3** (included with better-sqlite3)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/bernardopg/LASCMMG.git
cd lascmmg

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend-react && npm install && cd ..
```

### 2. Environment Setup

Create `.env` in the project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Settings
CORS_ORIGIN=http://localhost:5173

# Security Keys (generate with: npm run generate-keys)
JWT_SECRET=your-64-char-random-string
COOKIE_SECRET=your-64-char-random-string
CSRF_SECRET=your-32-char-random-string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Database
DB_PATH=./backend/data/lascmmg.db
DB_BACKUP_PATH=./backend/backups/

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true

# Performance
PERFORMANCE_MONITORING_ENABLED=true
QUERY_SLOW_THRESHOLD_MS=100
```

Create `frontend-react/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=LASCMMG
VITE_ENV=development
VITE_ENABLE_PWA=true
```

### 3. Generate Security Keys

```bash
npm run generate-keys
```

### 4. Database Setup

```bash
npm run setup:db
```

### 5. Start Development Servers

#### Option A: Single Terminal
```bash
npm run dev
```

#### Option B: Separate Terminals
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 6. Access Application

Open http://localhost:5173 in your browser

## 📦 Project Structure

```
lascmmg/
├── backend/               # Express server
│   ├── server.js         # Main entry point
│   ├── lib/              # Core libraries
│   │   ├── db/           # Database and Redis
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   ├── logger/       # Logging config
│   │   └── performance/  # Monitoring
│   └── routes/           # API endpoints
├── frontend-react/       # React application
│   ├── src/             # React source
│   ├── public/          # Static assets
│   └── package.json     # Frontend deps
├── scripts/             # Utility scripts
│   ├── generate-keys.js
│   ├── health-check.js
│   └── security-audit.js
└── package.json         # Root dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/csrf-token` - Get CSRF token

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Players
- `GET /api/players` - List all players
- `POST /api/players` - Register player
- `GET /api/players/:id` - Get player profile
- `PUT /api/players/:id` - Update player

### Scoring
- `POST /api/scores` - Submit match scores
- `GET /api/scores/tournament/:id` - Get tournament scores

### System
- `GET /ping` - Health check
- `GET /api/system/status` - System status
- `GET /api/admin/backup` - Backup management
- `GET /api/admin/performance` - Performance metrics

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **CSRF Protection**: Token validation for state-changing operations
- **Rate Limiting**: Configurable limits per endpoint
- **Helmet CSP**: Content Security Policy with per-request nonces
- **XSS Protection**: Input sanitization and output encoding
- **SQL Injection Prevention**: Parameterized queries
- **Honeypot Fields**: Bot detection on forms
- **Secure Cookies**: httpOnly, signed, SameSite strict
- **Audit Logging**: Complete activity tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Frontend tests
cd frontend-react && npm test

# E2E tests
cd frontend-react && npm run cypress:open
```

## 🏭 Production Deployment

### Build Frontend
```bash
cd frontend-react && npm run build
```

### Configure Production Environment
```bash
export NODE_ENV=production
# Update .env with production values
```

### Start with PM2
```bash
pm2 start backend/server.js --name lascmmg
pm2 save
pm2 startup
```

### Production Checklist
- [ ] HTTPS via reverse proxy (nginx/Apache)
- [ ] Strong, unique security secrets
- [ ] Redis authentication enabled
- [ ] Database backup automation
- [ ] Log rotation configured
- [ ] Monitoring and alerting setup
- [ ] Rate limits tuned for production
- [ ] CORS_ORIGIN set to production domain

## 🐳 Docker Quick Start

```bash
# Start Redis
docker run -d --name lascmmg-redis -p 6379:6379 redis:7-alpine

# Build and run application
docker build -t lascmmg .
docker run -d --name lascmmg-app -p 3000:3000 --link lascmmg-redis lascmmg
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Security Guide](./SECURITY.md)
- [Development Guide](./WARP.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass
- Code follows the existing style
- Documentation is updated
- Commit messages are descriptive

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Bernardo Pinto Gomes** - Initial work and maintenance

## 🙏 Acknowledgments

- LASCMMG community for requirements and feedback
- Open source contributors for the amazing tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bernardopg/LASCMMG/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bernardopg/LASCMMG/discussions)
- **Security**: For security concerns, please open a responsible disclosure issue

---

<div align="center">
  Made with ❤️ for the billiards community
</div>
