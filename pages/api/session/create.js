// Pure JavaScript Session Creation
const { createHyperbeamClient } = require('../../../lib/hyperbeam');

// Simple CSRF check
function isValidCSRF(token) {
  if (!token) return false;
  
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  
  const timestamp = parseInt(parts[0]);
  const now = Date.now();
  const ageMinutes = (now - timestamp) / (1000 * 60);
  
  return ageMinutes <= 5; // Valid for 5 minutes
}

module.exports = async function handler(req, res) {
  // CORS
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
    // Check CSRF
    const csrfToken = req.headers['x-csrf-token'];
    if (!isValidCSRF(csrfToken)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    console.log('Creating session...');
    
    // Create Hyperbeam client and session
    const hyperbeam = createHyperbeamClient();
    const session = await hyperbeam.createSession();
    
    console.log('Session created:', session.session_id);
    
    // Set cookie
    res.setHeader('Set-Cookie', 
      `sessionId=${session.session_id}; HttpOnly; Secure; SameSite=Strict; Max-Age=600; Path=/`
    );
    
    // Send response
    res.status(201).json({
      sessionId: session.session_id,
      embedUrl: session.embed_url,
      adminToken: session.admin_token,
      success: true
    });
    
  } catch (error) {
    console.error('Session creation failed:', error);
    
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message
    });
  }
};