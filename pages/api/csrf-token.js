const crypto = require('crypto');

// Simple CSRF token generation without dependencies
function generateSimpleToken() {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}:${randomBytes}`;
}

async function handler(req, res) {
  // Set CORS headers to prevent CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

module.exports = handler;