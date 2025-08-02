# Hyperbeam VM Deployment Guide

This guide will help you deploy the Hyperbeam VM application to Vercel with all required features:
- CSRF token protection
- 10-minute session limits
- 30-second inactivity timeout
- IP-based rate limiting
- Shared session functionality
- Fullscreen browser support

## Prerequisites

1. **Hyperbeam API Key**: Get your API key from [Hyperbeam.com](https://hyperbeam.com/)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Account**: For code repository hosting

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCyabanz%2Fwhack&env=HYPERBEAM_API_KEY&envDescription=Get%20your%20Hyperbeam%20API%20key%20from%20hyperbeam.com&envLink=https%3A%2F%2Fhyperbeam.com%2F&project-name=hyperbeam-vm&repository-name=hyperbeam-vm)

## Manual Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Cyabanz/whack.git
cd whack
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Hyperbeam API key:

```env
HYPERBEAM_API_KEY=your_actual_hyperbeam_api_key_here
```

### 4. Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application.

### 5. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

#### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set the environment variable `HYPERBEAM_API_KEY` in Vercel dashboard

### 6. Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - **Name**: `HYPERBEAM_API_KEY`
   - **Value**: Your Hyperbeam API key
   - **Environment**: Production, Preview, Development

## Troubleshooting

### Common Issues

#### 1. "Failed to create session" Error

**Cause**: Missing or invalid `HYPERBEAM_API_KEY` environment variable.

**Solution**: 
- Verify your Hyperbeam API key is correct
- Check that the environment variable is set in Vercel dashboard
- Redeploy after setting the environment variable

#### 2. "Unable to get security token" Error

**Cause**: API module export issues or server misconfiguration.

**Status**: ✅ **RESOLVED** - Fixed in latest deployment
- API routes now use proper `export default` syntax
- CSRF token generation working correctly

#### 3. "Page does not export a default function" Error

**Cause**: Next.js API routes require default exports.

**Status**: ✅ **RESOLVED** - Fixed in latest deployment
- All API routes now use `export default` for handlers
- Mixed CommonJS imports with ES6 exports for compatibility

#### 4. Session buttons not clickable

**Cause**: Frontend waiting for CSRF token.

**Status**: ✅ **RESOLVED** - Fixed in latest deployment
- Buttons are now clickable even while token loads
- Automatic token retry mechanism implemented
- Better error handling and user feedback

### Verify Deployment

Test these endpoints to ensure everything is working:

```bash
# Test API health
curl https://your-app.vercel.app/api/test

# Test CSRF token generation
curl https://your-app.vercel.app/api/csrf-token

# Test session creation (with valid token)
curl -X POST https://your-app.vercel.app/api/session/create \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN_HERE" \
  -d '{"isShared":false}'
```

Expected responses:
- `/api/test`: `{"message":"API is working","timestamp":"..."}`
- `/api/csrf-token`: `{"token":"timestamp:randomhex","expiresIn":300000}`
- `/api/session/create`: Either session data or "Hyperbeam API key not configured" error

## Security Features

### CSRF Protection
- Random tokens generated per request
- 5-minute token expiration
- Validation on all state-changing operations

### Rate Limiting
- 10 requests per minute per IP address
- Automatic cleanup of expired rate limit data
- Proper HTTP rate limit headers

### Session Management
- 10-minute maximum session duration
- 30-second inactivity timeout
- Automatic session cleanup
- Secure cookie handling

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Strict-Transport-Security

## Features

### Core Functionality
- ✅ Secure virtual browser sessions
- ✅ Private and shared session modes
- ✅ Session joining via session ID
- ✅ Automatic session termination
- ✅ Real-time session activity tracking

### User Interface
- ✅ Modern responsive design
- ✅ Fullscreen browser support
- ✅ Session status indicators
- ✅ Error handling and user feedback
- ✅ Mobile-friendly interface

### Technical
- ✅ Next.js API routes
- ✅ Vercel deployment ready
- ✅ TypeScript/JavaScript hybrid
- ✅ Tailwind CSS styling
- ✅ No external database required

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify all environment variables are set
3. Test the API endpoints manually
4. Review the browser console for frontend errors

For additional help, please check the project README or create an issue on GitHub.