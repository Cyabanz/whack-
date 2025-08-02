// Simple CSRF Token Generation - Pure JavaScript
import crypto from 'crypto';

// Simple token generation
function generateToken() {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${timestamp}:${randomBytes}`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Generating CSRF token...');
    const token = generateToken();
    console.log('Token generated:', token.substring(0, 20) + '...');
    
    res.status(200).json({
      token: token,
      expiresIn: 5 * 60 * 1000 // 5 minutes
    });
  } catch (error) {
    console.error('Token generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message 
    });
  }
}