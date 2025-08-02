// Pure JavaScript Session Creation with Shared Sessions
import { createHyperbeamClient } from '../../../lib/hyperbeam.js';

// Simple CSRF check
function isValidCSRF(token) {
  if (!token) return false;
  
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  
  const timestamp = parseInt(parts[0]);
  const now = Date.now();
  const ageMinutes = (now - timestamp) / (1000 * 60);
  
  return ageMinutes <= 5; // Valid for 5 minutes
}

// Simple in-memory session store for shared sessions
const sharedSessions = new Map();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check CSRF
    const csrfToken = req.headers['x-csrf-token'];
    if (!isValidCSRF(csrfToken)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    const { isShared = false, joinSessionId = null } = req.body || {};
    console.log('Creating session... isShared:', isShared, 'joinSessionId:', joinSessionId);
    
    let session;
    
    if (joinSessionId) {
      // Join existing shared session
      const existingSession = sharedSessions.get(joinSessionId);
      if (!existingSession) {
        return res.status(404).json({ error: 'Shared session not found' });
      }
      
      session = existingSession;
      console.log('Joined shared session:', joinSessionId);
    } else {
      // Create new Hyperbeam session
      const hyperbeam = createHyperbeamClient();
      session = await hyperbeam.createSession();
      
      if (isShared) {
        // Store in shared sessions map
        sharedSessions.set(session.session_id, session);
        console.log('Created shared session:', session.session_id);
      } else {
        console.log('Created private session:', session.session_id);
      }
    }
    
    // Set cookie
    res.setHeader('Set-Cookie', 
      `sessionId=${session.session_id}; HttpOnly; Secure; SameSite=Strict; Max-Age=600; Path=/`
    );
    
    // Send response
    res.status(201).json({
      sessionId: session.session_id,
      embedUrl: session.embed_url,
      adminToken: session.admin_token,
      isShared: isShared,
      isJoining: !!joinSessionId,
      success: true
    });
    
  } catch (error) {
    console.error('Session creation failed:', error);
    
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message
    });
  }
}