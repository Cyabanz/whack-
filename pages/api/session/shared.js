import { withSecurity, SessionManager, getClientIP } from '../../../lib/security.js';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get shared session info
      const { sessionId } = req.query;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      
      const sessionInfo = SessionManager.getSharedSessionInfo(sessionId);
      if (!sessionInfo) {
        return res.status(404).json({ error: 'Shared session not found' });
      }
      
      res.status(200).json(sessionInfo);
      
    } else if (req.method === 'POST') {
      // Join shared session
      const { sessionId } = req.body;
      const ipAddress = getClientIP(req);
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      
      const session = SessionManager.joinSharedSession(sessionId, ipAddress);
      if (!session) {
        return res.status(404).json({ error: 'Shared session not found or expired' });
      }
      
      res.status(200).json({
        sessionId: session.id,
        embedUrl: session.hyperbeamEmbedUrl,
        connectedIPs: session.connectedIPs,
        connectedCount: session.connectedIPs.length,
        message: 'Successfully joined shared session'
      });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Shared session error:', error);
    res.status(500).json({ error: 'Failed to process shared session request' });
  }
}

export default withSecurity(handler);