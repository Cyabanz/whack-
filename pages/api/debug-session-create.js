export default async function handler(req, res) {
  console.log('=== DEBUG SESSION CREATE START ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Cookies:', req.cookies);
  
  // CORS headers for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log('Wrong method, returning 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const apiKey = process.env.HYPERBEAM_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 8) + '...' : 'none');
    
    // Check CSRF token
    const csrfToken = req.headers['x-csrf-token'];
    console.log('CSRF Token received:', !!csrfToken);
    console.log('CSRF Token value:', csrfToken);
    
    if (!csrfToken) {
      console.log('No CSRF token, returning 403');
      return res.status(403).json({ error: 'Missing CSRF token' });
    }
    
    // Simple CSRF validation
    try {
      const [timestamp, randomBytes] = csrfToken.split(':');
      if (!timestamp || !randomBytes) {
        console.log('Invalid CSRF token format');
        return res.status(403).json({ error: 'Invalid CSRF token format' });
      }
      
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const ageMinutes = (now - tokenTime) / (1000 * 60);
      
      console.log('CSRF token age (minutes):', ageMinutes);
      
      if (ageMinutes > 5) {
        console.log('CSRF token expired');
        return res.status(403).json({ error: 'CSRF token expired' });
      }
    } catch (csrfError) {
      console.log('CSRF validation error:', csrfError);
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    console.log('CSRF token validated successfully');
    
    // Test Hyperbeam API directly
    console.log('Testing Hyperbeam API...');
    const hyperbeamResponse = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        width: 1280,
        height: 720,
        ublock: true,
        start_url: 'https://jmw-v7.pages.dev'
      }),
    });
    
    console.log('Hyperbeam response status:', hyperbeamResponse.status);
    console.log('Hyperbeam response headers:', Object.fromEntries(hyperbeamResponse.headers.entries()));
    
    if (!hyperbeamResponse.ok) {
      const errorText = await hyperbeamResponse.text();
      console.log('Hyperbeam error response:', errorText);
      return res.status(500).json({
        error: 'Hyperbeam API failed',
        status: hyperbeamResponse.status,
        details: errorText
      });
    }
    
    const hyperbeamData = await hyperbeamResponse.json();
    console.log('Hyperbeam success response:', hyperbeamData);
    
    // Create simple session response
    const sessionResponse = {
      sessionId: 'debug-session-' + Date.now(),
      embedUrl: hyperbeamData.embed_url,
      adminToken: hyperbeamData.admin_token,
      expiresAt: Date.now() + (10 * 60 * 1000),
      inactivityTimeout: 30 * 1000,
      isShared: false,
      connectedIPs: ['127.0.0.1'],
      connectedCount: 1,
      isJoining: false,
      debug: true
    };
    
    console.log('Sending session response:', sessionResponse);
    console.log('=== DEBUG SESSION CREATE SUCCESS ===');
    
    res.status(201).json(sessionResponse);
  } catch (error) {
    console.error('=== DEBUG SESSION CREATE ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Debug session creation failed',
      details: error.message,
      stack: error.stack
    });
  }
}