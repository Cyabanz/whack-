# Hyperbeam VM Vercel Application

A secure Hyperbeam VM application with CSRF token protection, session management, automatic timeouts, and rate limiting, designed for deployment on Vercel.

## 🚀 Features

- **Hyperbeam VM Integration**: Full virtual browser functionality
- **Shared Sessions**: Multiple users can join the same browser session
- **CSRF Protection**: Random token-based CSRF protection per session
- **Session Management**: 10-minute session limit with automatic cleanup
- **Inactivity Timeout**: Automatic termination after 30 seconds of inactivity
- **Rate Limiting**: 10 requests per minute per IP address
- **Secure Headers**: Comprehensive security headers and CSP
- **Real-time Session Monitoring**: Live session status and activity tracking
- **Error Handling**: Comprehensive error boundaries and graceful degradation
- **JavaScript**: Modern ES6+ JavaScript with React and Next.js
- **Responsive Design**: Modern, accessible UI with Tailwind CSS

## 🔒 Security Features

### CSRF Protection
- Random CSRF tokens generated per session (no secret required)
- Token validation for all POST/PUT/DELETE/PATCH requests
- 5-minute token expiration with automatic cleanup
- Session-specific token validation

### Session Management
- 10-minute maximum session duration
- 30-second inactivity timeout
- Automatic session cleanup and VM termination
- Secure HTTP-only cookies with SameSite protection

### Rate Limiting
- 10 requests per minute per IP address
- Automatic IP-based throttling
- Rate limit headers in responses

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Strict HTTPS enforcement

## 📋 Prerequisites

- Node.js 18+ 
- Hyperbeam API Key ([Get one here](https://hyperbeam.com))
- Vercel account for deployment (optional)

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hyperbeam-vm-vercel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   HYPERBEAM_API_KEY=your_hyperbeam_api_key_here
   ```
   Note: CSRF tokens are now generated automatically per session

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `HYPERBEAM_API_KEY`

4. **Your application will be available at your Vercel URL**

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `HYPERBEAM_API_KEY` | ✅ | Your Hyperbeam API key | - |
| `SESSION_TIMEOUT` | ❌ | Session timeout in milliseconds | 600000 (10 min) |
| `INACTIVITY_TIMEOUT` | ❌ | Inactivity timeout in milliseconds | 30000 (30 sec) |
| `RATE_LIMIT_REQUESTS` | ❌ | Max requests per minute per IP | 10 |
| `RATE_LIMIT_WINDOW` | ❌ | Rate limit window in milliseconds | 60000 (1 min) |

**Note:** CSRF tokens are now generated automatically per session - no secret configuration needed!

## 📁 Project Structure

```
├── components/          # React components
│   ├── ErrorBoundary.tsx
│   ├── HyperbeamClient.tsx
│   └── SessionManager.tsx
├── lib/                # Utility libraries
│   ├── hyperbeam.ts    # Hyperbeam API integration
│   └── security.ts     # Security middleware & utilities
├── pages/              # Next.js pages
│   ├── api/            # API endpoints
│   │   ├── csrf-token.ts
│   │   └── session/
│   │       ├── create.ts
│   │       ├── heartbeat.ts
│   │       ├── status.ts
│   │       └── terminate.ts
│   ├── _app.tsx
│   └── index.tsx
├── styles/             # CSS styles
│   └── globals.css
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vercel.json         # Vercel deployment configuration
```

## 🔧 API Endpoints

### Authentication & Security

- `GET /api/csrf-token` - Generate CSRF token
- `GET /api/session/status` - Check session status

### Session Management

- `POST /api/session/create` - Create new VM session (private or shared)
- `POST /api/session/heartbeat` - Keep session alive
- `POST /api/session/terminate` - End session
- `GET /api/session/shared?sessionId=xxx` - Get shared session info
- `POST /api/session/shared` - Join shared session

All endpoints include:
- Rate limiting (10 req/min per IP)
- CSRF protection (for state-changing operations)
- Security headers
- Error handling

## 🎯 Usage

### Private Sessions
1. **Start a Private Session:**
   - Click "Start Private Browser"
   - System creates secure session with CSRF protection
   - VM launches with 10-minute timeout

### Shared Sessions
1. **Create a Shared Session:**
   - Click "Start Shared Browser"
   - Share the displayed Session ID with others
   - Multiple users can control the same browser

2. **Join a Shared Session:**
   - Click "Join Shared Session"
   - Enter the Session ID from another user
   - Instantly connect to their browser session

### General Usage
3. **Use the Virtual Browser:**
   - Navigate using browser controls
   - Quick access to Google, YouTube, GitHub
   - Real-time session monitoring in header

4. **Session Management:**
   - Automatic heartbeat keeps session alive during activity
   - Warning appears 2 minutes before expiration
   - Automatic termination after 30 seconds of inactivity

5. **End Session:**
   - Click "End/Leave Session" button
   - Or wait for automatic timeout
   - VM and local session cleaned up automatically

## 🔍 Monitoring & Debugging

### Session Monitoring
- Real-time countdown timer
- Activity indicator (green/yellow/red)
- Session ID display (development)

### Rate Limiting Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640995200
```

### Error Handling
- Network errors with retry suggestions
- Rate limit errors with reset time
- Session expiration with automatic cleanup
- Hyperbeam connection failures

## 🧪 Testing

Run the application locally and test:

1. **CSRF Protection:**
   - Try API calls without CSRF token (should fail)
   - Verify token expiration (5 minutes)

2. **Session Management:**
   - Create session and wait 10 minutes (should expire)
   - Be inactive for 30 seconds (should timeout)

3. **Rate Limiting:**
   - Make >10 requests in 1 minute (should be throttled)

4. **Security Headers:**
   - Check browser developer tools for security headers

## 🛡️ Security Considerations

- **Never expose API keys** in client-side code
- **CSRF tokens** are required for all state-changing operations
- **Sessions** automatically expire and clean up
- **Rate limiting** prevents abuse
- **Security headers** protect against common attacks
- **Input validation** on all API endpoints

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues related to:
- **Hyperbeam VM**: [Hyperbeam Documentation](https://docs.hyperbeam.com)
- **Vercel Deployment**: [Vercel Documentation](https://vercel.com/docs)
- **This Application**: Create an issue in this repository

---

Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Hyperbeam VM