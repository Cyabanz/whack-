import crypto from 'crypto';

// Import rate limiting functions - we'll inline them to avoid module issues
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
}

// Simple rate limiter implementation
const requests = new Map();

const RateLimiter = {
  isAllowed(ip) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 10;
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const userRequests = requests.get(ip);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    return true;
  },
  
  getRemainingRequests(ip) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 10;
    
    if (!requests.has(ip)) {
      return maxRequests;
    }
    
    const userRequests = requests.get(ip);
    const validRequests = userRequests.filter(time => now - time < windowMs);
    return Math.max(0, maxRequests - validRequests.length);
  },
  
  getResetTime(ip) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    
    if (!requests.has(ip)) {
      return now + windowMs;
    }
    
    const userRequests = requests.get(ip);
    if (userRequests.length === 0) {
      return now + windowMs;
    }
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + windowMs;
  }
};

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