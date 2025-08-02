const { withSecurity, SessionManager } = require('../../../lib/security');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'No session found' });
    }

    const session = SessionManager.getSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Update activity timestamp
    const updated = SessionManager.updateActivity(sessionId);
    if (!updated) {
      return res.status(401).json({ error: 'Failed to update session' });
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, (session.createdAt + (10 * 60 * 1000)) - now);
    const lastActivity = now - session.lastActivity;

    res.status(200).json({
      sessionId: session.id,
      timeRemaining,
      lastActivity,
      isActive: true
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
}

export default withSecurity(handler);