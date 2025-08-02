// Pure JavaScript Frontend
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [csrfToken, setCsrfToken] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get CSRF token on page load
  useEffect(() => {
    fetchCSRFToken();
  }, []);

  async function fetchCSRFToken() {
    try {
      setLoading(true);
      console.log('Fetching CSRF token...');
      
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      
      if (response.ok) {
        setCsrfToken(data.token);
        console.log('CSRF token received');
      } else {
        setError('Failed to get security token: ' + data.error);
      }
    } catch (err) {
      console.error('CSRF fetch error:', err);
      setError('Failed to get security token: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createSession() {
    if (!csrfToken) {
      await fetchCSRFToken();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Creating session...');
      
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSession(data);
        console.log('Session created:', data.sessionId);
      } else {
        setError('Failed to create session: ' + data.error);
        console.error('Session creation failed:', data);
      }
    } catch (err) {
      console.error('Session creation error:', err);
      setError('Failed to create session: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function terminateSession() {
    setSession(null);
    setError(null);
    console.log('Session terminated');
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px' }}>
      <h1>Hyperbeam Virtual Browser</h1>
      
      {/* Error Display */}
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <p style={{ color: '#c33', margin: 0 }}>{error}</p>
          <button 
            onClick={() => setError(null)}
            style={{ marginTop: '10px', fontSize: '12px' }}
          >
            Dismiss
          </button>
          
          {/* Debug Buttons */}
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug-basic');
                  const data = await response.json();
                  alert('Basic Test: ' + JSON.stringify(data, null, 2));
                } catch (err) {
                  alert('Basic Test Error: ' + err.message);
                }
              }}
              style={{ fontSize: '12px', marginRight: '5px' }}
            >
              Test API
            </button>
            
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-hyperbeam-simple');
                  const data = await response.json();
                  alert('Hyperbeam Test: ' + JSON.stringify(data, null, 2));
                } catch (err) {
                  alert('Hyperbeam Error: ' + err.message);
                }
              }}
              style={{ fontSize: '12px' }}
            >
              Test Hyperbeam
            </button>
          </div>
        </div>
      )}
      
      {/* Session Controls */}
      {!session ? (
        <div>
          <p>No active session</p>
          <button 
            onClick={createSession}
            disabled={loading}
            style={{
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Creating...' : 'Start Virtual Browser'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Virtual Browser Active</h2>
          <p>Session ID: {session.sessionId}</p>
          
          {/* Hyperbeam Embed */}
          <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
            <iframe
              src={session.embedUrl}
              width="100%"
              height="600"
              style={{ border: 'none', borderRadius: '4px' }}
              title="Virtual Browser"
            />
          </div>
          
          <button 
            onClick={terminateSession}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            End Session
          </button>
        </div>
      )}
      
      {/* Debug Info */}
      {error && (
        <details style={{ marginTop: '20px', fontSize: '12px' }}>
          <summary>Debug Info</summary>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify({
              timestamp: new Date().toISOString(),
              csrfToken: csrfToken ? 'present' : 'missing',
              session: session ? 'present' : 'missing',
              loading: loading,
              error: error
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}