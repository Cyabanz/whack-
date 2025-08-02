import { NextApiRequest, NextApiResponse } from 'next';
import { withSecurity, SessionManager, getClientIP } from '../../../lib/security';
import { HyperbeamClient } from '../../../lib/hyperbeam';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ipAddress = getClientIP(req);
    
    // Check if user already has an active session
    const existingSessionId = req.cookies.sessionId;
    if (existingSessionId) {
      const existingSession = SessionManager.getSession(existingSessionId);
      if (existingSession) {
        return res.status(400).json({ 
          error: 'Session already exists',
          sessionId: existingSession.id
        });
      }
    }

    // Create new session
    const session = SessionManager.createSession(ipAddress);
    
    // Create Hyperbeam VM session
    const hyperbeamClient = new HyperbeamClient();
    const hyperbeamSession = await hyperbeamClient.createSession({
      width: 1280,
      height: 720,
      ublock: true,
      autoplay: false
    });

    // Store Hyperbeam embed URL in session
    session.hyperbeamEmbedUrl = hyperbeamSession.embed_url;

    // Set session cookie (httpOnly, secure, sameSite)
    res.setHeader('Set-Cookie', [
      `sessionId=${session.id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${10 * 60}; Path=/`,
      `hyperbeamSessionId=${hyperbeamSession.session_id}; HttpOnly; Secure; SameSite=Strict; Max-Age=${10 * 60}; Path=/`
    ]);

    res.status(201).json({
      sessionId: session.id,
      embedUrl: hyperbeamSession.embed_url,
      adminToken: hyperbeamSession.admin_token,
      expiresAt: session.createdAt + (10 * 60 * 1000),
      inactivityTimeout: 30 * 1000
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
}

export default withSecurity(handler);