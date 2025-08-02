export default async function handler(req, res) {
  console.log('=== DEMO SESSION CREATE ===');
  
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
    // Simple CSRF validation
    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken) {
      return res.status(403).json({ error: 'Missing CSRF token' });
    }
    
    // Basic token validation
    const [timestamp, randomBytes] = csrfToken.split(':');
    if (!timestamp || !randomBytes) {
      return res.status(403).json({ error: 'Invalid CSRF token format' });
    }
    
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) { // 5 minutes
      return res.status(403).json({ error: 'CSRF token expired' });
    }
    
    console.log('CSRF validated, creating demo session...');
    
    // Generate demo session data
    const sessionId = 'demo-' + Date.now();
    const embedUrl = `https://demo.hyperbeam.com/demo-session?id=${sessionId}`;
    
    // Set demo session cookie
    res.setHeader('Set-Cookie', [
      `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${10 * 60}; Path=/`,
      `hyperbeamSessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${10 * 60}; Path=/`
    ]);
    
    // Return demo session response
    res.status(201).json({
      sessionId: sessionId,
      embedUrl: embedUrl,
      adminToken: 'demo-admin-token-' + Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000),
      inactivityTimeout: 30 * 1000,
      isShared: false,
      connectedIPs: ['127.0.0.1'],
      connectedCount: 1,
      isJoining: false,
      demo: true,
      message: 'This is a demo session. To use real Hyperbeam VMs, you need a valid Hyperbeam API key.'
    });
    
  } catch (error) {
    console.error('Demo session creation error:', error);
    res.status(500).json({
      error: 'Failed to create demo session',
      details: error.message
    });
  }
}