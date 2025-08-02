import { withSecurity, SessionManager } from '../../../lib/security.js';
import { HyperbeamClient } from '../../../lib/hyperbeam.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    const hyperbeamSessionId = req.cookies.hyperbeamSessionId;
    
    if (!sessionId) {
      return res.status(401).json({ error: 'No session found' });
    }

    // Terminate Hyperbeam session if exists
    if (hyperbeamSessionId) {
      try {
        const hyperbeamClient = new HyperbeamClient();
        await hyperbeamClient.terminateSession(hyperbeamSessionId);
      } catch (error) {
        console.error('Failed to terminate Hyperbeam session:', error);
        // Continue anyway
      }
    }

    // Delete local session
    const deleted = SessionManager.deleteSession(sessionId);

    // Clear cookies
    res.setHeader('Set-Cookie', [
      'sessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
      'hyperbeamSessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    ]);

    res.status(200).json({
      success: true,
      sessionTerminated: deleted
    });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
}

export default withSecurity(handler);