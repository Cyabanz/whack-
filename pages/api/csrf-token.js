const { withSecurity, CSRFTokenManager } = require('../../lib/security');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = CSRFTokenManager.generateToken();
    
    res.status(200).json({
      token,
      expiresIn: 5 * 60 * 1000 // 5 minutes in milliseconds
    });
  } catch (error) {
    console.error('Failed to generate CSRF token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}

module.exports = withSecurity(handler);