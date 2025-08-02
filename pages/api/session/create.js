// Session Creation API - Simplified based on Hyperbeam Documentation
const { HyperbeamClient } = require('../../../lib/hyperbeam');

// Simple CSRF validation
function validateCSRFToken(token) {
  if (!token) return false;
  
  try {
    const [timestamp, randomBytes] = token.split(':');
    if (!timestamp || !randomBytes) return false;
    
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const ageMinutes = (now - tokenTime) / (1000 * 60);
    
    return ageMinutes <= 5; // 5 minute expiry
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate CSRF token
    const csrfToken = req.headers['x-csrf-token'];
    if (!validateCSRFToken(csrfToken)) {
      return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }

    console.log('Creating new Hyperbeam session...');
    
    // Initialize Hyperbeam client
    const hyperbeam = new HyperbeamClient();
    
    // Create session with minimal configuration
    const session = await hyperbeam.createSession({
      start_url: 'https://jmw-v7.pages.dev',
      width: 1280,
      height: 720,
      ublock: true,
      region: 'NA'
    });
    
    console.log('Hyperbeam session created:', session.session_id);
    
    // Set session cookie
    const cookieMaxAge = 10 * 60; // 10 minutes
    res.setHeader('Set-Cookie', [
      `sessionId=${session.session_id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${cookieMaxAge}; Path=/`,
      `hyperbeamSessionId=${session.session_id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${cookieMaxAge}; Path=/`
    ]);
    
    // Return session data
    res.status(201).json({
      sessionId: session.session_id,
      embedUrl: session.embed_url,
      adminToken: session.admin_token,
      expiresAt: Date.now() + (cookieMaxAge * 1000),
      message: 'Session created successfully'
    });
    
  } catch (error) {
    console.error('Session creation failed:', error);
    
    // Return specific error based on the error message
    if (error.message.includes('HYPERBEAM_API_KEY')) {
      return res.status(500).json({
        error: 'Hyperbeam API key not configured',
        details: 'Please set HYPERBEAM_API_KEY environment variable'
      });
    }
    
    if (error.message.includes('Hyperbeam API error')) {
      return res.status(500).json({
        error: 'Hyperbeam API failed',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to create session',
      details: error.message
    });
  }
}