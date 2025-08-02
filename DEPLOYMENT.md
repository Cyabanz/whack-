# Deployment Guide

## 🚀 Quick Deploy to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCyabanz%2Fwhack-&env=HYPERBEAM_API_KEY&envDescription=Your%20Hyperbeam%20API%20Key&envLink=https%3A%2F%2Fhyperbeam.com%2F)

### Manual Deploy

1. **Clone Repository:**
   ```bash
   git clone https://github.com/Cyabanz/whack-.git
   cd whack-
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Hyperbeam API key to `.env.local`:
   ```env
   HYPERBEAM_API_KEY=your_api_key_here
   ```

4. **Test Locally:**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel:**
   ```bash
   npx vercel
   ```

   Or connect your GitHub repository at [vercel.com](https://vercel.com)

## 🔧 Environment Variables

Only one environment variable is required:

| Variable | Required | Description |
|----------|----------|-------------|
| `HYPERBEAM_API_KEY` | ✅ | Get from [hyperbeam.com](https://hyperbeam.com) |

## 🌟 Features Included

- ✅ **Random CSRF Tokens** - Generated automatically per session
- ✅ **Shared Sessions** - Multiple users can join the same browser
- ✅ **Session Limits** - 10-minute timeout with 30-second inactivity
- ✅ **Rate Limiting** - 10 requests per minute per IP
- ✅ **Security Headers** - Comprehensive protection
- ✅ **Error Handling** - Graceful degradation
- ✅ **Modern UI** - Responsive Tailwind CSS design

## 🔗 API Endpoints

### Session Management
- `GET /api/csrf-token` - Get CSRF token
- `POST /api/session/create` - Create session (private/shared)
- `POST /api/session/heartbeat` - Keep session alive
- `GET /api/session/status` - Check session status
- `POST /api/session/terminate` - End session

### Shared Sessions
- `GET /api/session/shared?sessionId=xxx` - Get shared session info
- `POST /api/session/shared` - Join shared session

## 🎯 Usage Examples

### Private Session
```javascript
// Create private session
fetch('/api/session/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ isShared: false })
})
```

### Shared Session
```javascript
// Create shared session
fetch('/api/session/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ isShared: true })
})

// Join shared session
fetch('/api/session/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({ joinSessionId: 'session-id-here' })
})
```

## 🛡️ Security Features

- **CSRF Protection**: Random tokens per session
- **Rate Limiting**: Prevents API abuse
- **Session Isolation**: Secure cookie-based sessions
- **Input Validation**: All API endpoints validated
- **Security Headers**: CSP, X-Frame-Options, etc.

## 📱 Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to create session"**
   - Check HYPERBEAM_API_KEY is set correctly
   - Verify API key is valid at hyperbeam.com

2. **"CSRF token not available"**
   - Refresh the page to generate new token
   - Check browser allows cookies

3. **"Session expired"**
   - Sessions auto-expire after 10 minutes
   - Create a new session

4. **Rate limiting errors**
   - Wait 1 minute between requests
   - Each IP limited to 10 requests/minute

## 📞 Support

- **Hyperbeam Issues**: [docs.hyperbeam.com](https://docs.hyperbeam.com)
- **Vercel Issues**: [vercel.com/docs](https://vercel.com/docs)
- **Application Issues**: Create GitHub issue

---

Built with ❤️ using Next.js, React, Tailwind CSS, and Hyperbeam VM