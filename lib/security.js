const crypto = require('crypto');

// CSRF Token Management
class CSRFTokenManager {
  static tokens = new Map(); // Store tokens with their secrets
  static defaultSecret = crypto.randomBytes(32).toString('hex');

  static generateToken(sessionId = null) {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const tokenSecret = crypto.randomBytes(32).toString('hex');
    const data = `${timestamp}:${randomBytes}`;
    const hmac = crypto.createHmac('sha256', tokenSecret);
    hmac.update(data);
    const signature = hmac.digest('hex');
    const token = `${data}:${signature}`;
    
    // Store token with its secret and expiration
    this.tokens.set(token, {
      secret: tokenSecret,
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    return token;
  }

  static validateToken(token, sessionId = null) {
    try {
      const tokenData = this.tokens.get(token);
      if (!tokenData) return false;
      
      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        this.tokens.delete(token);
        return false;
      }
      
      // Check session association if provided
      if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
        return false;
      }

      const [timestamp, randomBytes, signature] = token.split(':');
      if (!timestamp || !randomBytes || !signature) return false;

      // Verify signature
      const data = `${timestamp}:${randomBytes}`;
      const hmac = crypto.createHmac('sha256', tokenData.secret);
      hmac.update(data);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }
  
  static cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of Array.from(this.tokens.entries())) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }
  
  static deleteToken(token) {
    return this.tokens.delete(token);
  }
}

// Session Management
class SessionManager {
  static sessions = new Map();
  static sharedSessions = new Map(); // sessionId -> array of connected IPs
  static SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  static INACTIVITY_TIMEOUT = 30 * 1000; // 30 seconds

  static createSession(ipAddress, isShared = false) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    
    const session = {
      id: sessionId,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      isShared,
      connectedIPs: [ipAddress]
    };

    this.sessions.set(sessionId, session);
    
    if (isShared) {
      this.sharedSessions.set(sessionId, [ipAddress]);
    }
    
    this.scheduleCleanup();
    
    return session;
  }
  
  static joinSharedSession(sessionId, ipAddress) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isShared) return null;
    
    // Check if session is still valid
    const now = Date.now();
    if (now - session.createdAt > this.SESSION_TIMEOUT || 
        now - session.lastActivity > this.INACTIVITY_TIMEOUT) {
      this.deleteSession(sessionId);
      return null;
    }
    
    // Add IP to shared session
    if (!session.connectedIPs.includes(ipAddress)) {
      session.connectedIPs.push(ipAddress);
    }
    
    if (this.sharedSessions.has(sessionId)) {
      const connectedIPs = this.sharedSessions.get(sessionId);
      if (!connectedIPs.includes(ipAddress)) {
        connectedIPs.push(ipAddress);
      }
    }
    
    // Update activity
    session.lastActivity = now;
    
    return session;
  }

  static getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    
    // Check session timeout (10 minutes)
    if (now - session.createdAt > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Check inactivity timeout (30 seconds)
    if (now - session.lastActivity > this.INACTIVITY_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  static updateActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.lastActivity = Date.now();
    return true;
  }

  static deleteSession(sessionId) {
    this.sharedSessions.delete(sessionId);
    return this.sessions.delete(sessionId);
  }
  
  static getSharedSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isShared) return null;
    
    return {
      id: session.id,
      connectedIPs: session.connectedIPs,
      connectedCount: session.connectedIPs.length,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }

  static scheduleCleanup() {
    // Clean up expired sessions every minute
    setTimeout(() => {
      const now = Date.now();
      const sessionEntries = Array.from(this.sessions.entries());
      for (const [sessionId, session] of sessionEntries) {
        if (
          now - session.createdAt > this.SESSION_TIMEOUT ||
          now - session.lastActivity > this.INACTIVITY_TIMEOUT
        ) {
          this.sessions.delete(sessionId);
        }
      }
      this.scheduleCleanup();
    }, 60 * 1000);
  }
}

// Rate Limiting
class RateLimiter {
  static requests = new Map();
  static WINDOW_SIZE = 60 * 1000; // 1 minute
  static MAX_REQUESTS = 10; // 10 requests per minute per IP

  static isAllowed(ipAddress) {
    const now = Date.now();
    const clientData = this.requests.get(ipAddress);

    if (!clientData || now > clientData.resetTime) {
      // Reset or create new window
      this.requests.set(ipAddress, {
        count: 1,
        resetTime: now + this.WINDOW_SIZE
      });
      return true;
    }

    if (clientData.count >= this.MAX_REQUESTS) {
      return false;
    }

    clientData.count++;
    return true;
  }

  static getRemainingRequests(ipAddress) {
    const clientData = this.requests.get(ipAddress);
    if (!clientData || Date.now() > clientData.resetTime) {
      return this.MAX_REQUESTS;
    }
    return Math.max(0, this.MAX_REQUESTS - clientData.count);
  }

  static getResetTime(ipAddress) {
    const clientData = this.requests.get(ipAddress);
    if (!clientData || Date.now() > clientData.resetTime) {
      return Date.now() + this.WINDOW_SIZE;
    }
    return clientData.resetTime;
  }
}

// Utility function to get client IP
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  return req.socket.remoteAddress || 'unknown';
}

// Security middleware
function withSecurity(handler) {
  return async (req, res) => {
    const ipAddress = getClientIP(req);

    // Rate limiting
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

    // CSRF protection for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
      const csrfToken = req.headers['x-csrf-token'];
      const sessionId = req.cookies.sessionId;
      
      console.log('CSRF Check:', { 
        method: req.method, 
        hasToken: !!csrfToken, 
        sessionId: sessionId,
        path: req.url 
      });
      
      if (!csrfToken || !CSRFTokenManager.validateToken(csrfToken, sessionId)) {
        console.log('CSRF validation failed:', { csrfToken: csrfToken?.substring(0, 10) + '...' });
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
      }
    }

    // Continue to handler
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = {
  CSRFTokenManager,
  SessionManager,
  RateLimiter,
  getClientIP,
  withSecurity
};