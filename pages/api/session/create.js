const { withSecurity, SessionManager, getClientIP } = require('../../../lib/security');
const { HyperbeamClient } = require('../../../lib/hyperbeam');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ipAddress = getClientIP(req);
    const { isShared = false, joinSessionId = null } = req.body || {};
    
    let session;
    
    // Check if joining an existing shared session
    if (joinSessionId) {
      session = SessionManager.joinSharedSession(joinSessionId, ipAddress);
      if (!session) {
        return res.status(404).json({ 
          error: 'Shared session not found or expired'
        });
      }
    } else {
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
      session = SessionManager.createSession(ipAddress, isShared);
    }
    
    // Create Hyperbeam VM session only if not joining existing
    let hyperbeamSession;
    if (!joinSessionId) {
      // Check if Hyperbeam API key is configured
      if (!process.env.HYPERBEAM_API_KEY) {
        return res.status(500).json({ 
          error: 'Hyperbeam API key not configured',
          details: 'Please set the HYPERBEAM_API_KEY environment variable'
        });
      }
      
      try {
        console.log('Creating Hyperbeam client...');
        const hyperbeamClient = new HyperbeamClient();
        console.log('Hyperbeam client created, calling createSession...');
        
        hyperbeamSession = await hyperbeamClient.createSession({
          width: 1280,
          height: 720,
          ublock: true,
          autoplay: false
        });
        
        console.log('Hyperbeam session created successfully:', {
          sessionId: hyperbeamSession.session_id,
          hasEmbedUrl: !!hyperbeamSession.embed_url
        });
      } catch (hyperbeamError) {
        console.error('Hyperbeam API error:', hyperbeamError);
        return res.status(500).json({
          error: 'Failed to create Hyperbeam session',
          details: hyperbeamError.message,
          type: 'HyperbeamError'
        });
      }

      // Store Hyperbeam embed URL in session
      session.hyperbeamEmbedUrl = hyperbeamSession.embed_url;
      session.hyperbeamSessionId = hyperbeamSession.session_id;
      session.adminToken = hyperbeamSession.admin_token;
    } else {
      // Use existing Hyperbeam session data
      hyperbeamSession = {
        embed_url: session.hyperbeamEmbedUrl,
        session_id: session.hyperbeamSessionId,
        admin_token: session.adminToken
      };
    }

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
      inactivityTimeout: 30 * 1000,
      isShared: session.isShared,
      connectedIPs: session.connectedIPs,
      connectedCount: session.connectedIPs.length,
      isJoining: !!joinSessionId
    });
  } catch (error) {
    console.error('Failed to create session:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message,
      type: error.name || 'Unknown'
    });
  }
}

export default withSecurity(handler);