const crypto = require('crypto');
const { RateLimiter, getClientIP } = require('../../lib/security');

// Simple CSRF token generation without dependencies
function generateSimpleToken() {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}:${randomBytes}`;
}

export default async function handler(req, res) {
  // Set CORS headers to prevent CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  const ipAddress = getClientIP(req);
  if (!RateLimiter.isAllowed(ipAddress)) {
    const resetTime = RateLimiter.getResetTime(ipAddress);
    res.setHeader('X-RateLimit-Limit', '10');
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    return res.status(429).json({
      error: 'Too many requests',
      resetTime: resetTime
    });
  }

  // Set rate limit headers
  const remaining = RateLimiter.getRemainingRequests(ipAddress);
  const resetTime = RateLimiter.getResetTime(ipAddress);
  res.setHeader('X-RateLimit-Limit', '10');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

  try {
    console.log('Generating CSRF token...');
    const token = generateSimpleToken();
    console.log('Token generated successfully');
    
    res.status(200).json({
      token,
      expiresIn: 5 * 60 * 1000 // 5 minutes in milliseconds
    });
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message 
    });
  }
}