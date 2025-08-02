import { NextApiRequest, NextApiResponse } from 'next';
import { withSecurity, SessionManager } from '../../../lib/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(200).json({
        hasSession: false,
        session: null
      });
    }

    const session = SessionManager.getSession(sessionId);
    if (!session) {
      // Clear invalid session cookie
      res.setHeader('Set-Cookie', [
        'sessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
        'hyperbeamSessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      ]);
      
      return res.status(200).json({
        hasSession: false,
        session: null
      });
    }

    const now = Date.now();
    const timeRemaining = Math.max(0, (session.createdAt + (10 * 60 * 1000)) - now);
    const timeSinceActivity = now - session.lastActivity;

    res.status(200).json({
      hasSession: true,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        timeRemaining,
        timeSinceActivity,
        embedUrl: session.hyperbeamEmbedUrl,
        willExpireAt: session.createdAt + (10 * 60 * 1000),
        inactivityLimit: 30 * 1000
      }
    });
  } catch (error) {
    console.error('Failed to get session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
}

export default withSecurity(handler);