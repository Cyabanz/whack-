// Pure JavaScript Frontend with Shared Sessions and Fullscreen
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function HomePage() {
  const [csrfToken, setCsrfToken] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hyperbeamClient, setHyperbeamClient] = useState(null);
  
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // Get CSRF token on page load
  useEffect(() => {
    fetchCSRFToken();
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load Hyperbeam SDK when session is created
  useEffect(() => {
    if (session && session.embedUrl && !hyperbeamClient) {
      loadHyperbeamSDK();
    }
  }, [session]);

  async function fetchCSRFToken() {
    try {
      setLoading(true);
      console.log('Fetching CSRF token...');
      
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      
      if (response.ok) {
        setCsrfToken(data.token);
        console.log('CSRF token received');
        setError(null);
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

  async function createSession(isShared = false, joinSessionId = null) {
    if (!csrfToken) {
      await fetchCSRFToken();
      if (!csrfToken) return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Creating session... isShared:', isShared, 'joinSessionId:', joinSessionId);
      
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          isShared,
          joinSessionId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSession(data);
        console.log('Session created:', data.sessionId);
        
        if (joinSessionId) {
          setShowJoinModal(false);
          setJoinSessionId('');
        }
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

  async function joinSharedSession() {
    if (!joinSessionId.trim()) {
      setError('Please enter a valid session ID');
      return;
    }
    await createSession(false, joinSessionId.trim());
  }

  function terminateSession() {
    setSession(null);
    setError(null);
    setHyperbeamClient(null);
    console.log('Session terminated');
  }

  async function toggleFullscreen() {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      setError('Fullscreen not supported or failed');
    }
  }

  async function loadHyperbeamSDK() {
    try {
      console.log('Loading Hyperbeam SDK...');
      
      // Load SDK script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@hyperbeam/web@latest/dist/index.js';
      script.type = 'module';
      
      script.onload = async () => {
        console.log('Hyperbeam SDK loaded');
        
        // Wait for global Hyperbeam to be available
        let attempts = 0;
        while (!window.Hyperbeam && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (window.Hyperbeam && containerRef.current) {
          try {
            console.log('Initializing Hyperbeam client...');
            const hb = await window.Hyperbeam(containerRef.current, session.embedUrl, {
              timeout: 5000,
              volume: 0.8,
              delegateKeyboard: true,
              onDisconnect: (e) => {
                console.log('Hyperbeam disconnected:', e.type);
                setError(`Session disconnected: ${e.type}`);
              },
              onConnectionStateChange: (e) => {
                console.log('Connection state:', e.state);
              }
            });
            
            setHyperbeamClient(hb);
            console.log('Hyperbeam client initialized successfully');
          } catch (initError) {
            console.error('Hyperbeam init error:', initError);
            setError('Failed to initialize Hyperbeam: ' + initError.message);
          }
        }
      };
      
      script.onerror = () => {
        console.error('Failed to load Hyperbeam SDK');
        setError('Failed to load Hyperbeam SDK');
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('SDK loading error:', error);
      setError('Failed to load Hyperbeam SDK: ' + error.message);
    }
  }

  async function testHyperbeamSDK() {
    if (!hyperbeamClient) {
      setError('No Hyperbeam client available. Create a session first.');
      return;
    }
    
    try {
      console.log('Testing Hyperbeam SDK...');
      
      // Test various SDK features
      const tests = {
        volume: hyperbeamClient.volume || 'Not available',
        width: hyperbeamClient.width || 'Not available',
        height: hyperbeamClient.height || 'Not available',
        userId: hyperbeamClient.userId || 'Not available',
        adminToken: hyperbeamClient.adminToken || 'Not available'
      };
      
      // Test navigation if available
      if (hyperbeamClient.tabs && hyperbeamClient.tabs.update) {
        await hyperbeamClient.tabs.update({ url: 'https://google.com' });
        tests.navigation = 'Successfully navigated to Google';
      } else {
        tests.navigation = 'Navigation not available';
      }
      
      alert('Hyperbeam SDK Test Results:\n' + JSON.stringify(tests, null, 2));
      console.log('SDK test results:', tests);
    } catch (error) {
      console.error('SDK test error:', error);
      alert('SDK Test Error: ' + error.message);
    }
  }

  return (
    <>
      <Head>
        <title>Hyperbeam Virtual Browser</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
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
            <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
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
                style={{ fontSize: '12px', padding: '4px 8px' }}
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
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Test Hyperbeam
              </button>
              
              <button 
                onClick={fetchCSRFToken}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Retry Token
              </button>
            </div>
          </div>
        )}
        
        {/* Session Controls */}
        {!session ? (
          <div>
            <p>No active session</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button 
                onClick={() => createSession(false)}
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
                {loading ? 'Creating...' : 'Start Private Browser'}
              </button>
              
              <button 
                onClick={() => createSession(true)}
                disabled={loading}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Creating...' : 'Start Shared Browser'}
              </button>
              
              <button 
                onClick={() => setShowJoinModal(true)}
                disabled={loading}
                style={{
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Join Shared Session
              </button>
            </div>
            
            {!csrfToken && !error && (
              <p style={{ color: '#666', fontSize: '14px' }}>🔄 Loading security token...</p>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h2>{session.isShared ? 'Shared' : 'Private'} Virtual Browser</h2>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  Session ID: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>{session.sessionId}</code>
                  {session.isJoining && <span style={{ color: '#28a745', marginLeft: '10px' }}>✓ Joined shared session</span>}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {hyperbeamClient && (
                  <button 
                    onClick={testHyperbeamSDK}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Test SDK
                  </button>
                )}
                
                <button 
                  onClick={toggleFullscreen}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen'}
                </button>
                
                <button 
                  onClick={terminateSession}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  End Session
                </button>
              </div>
            </div>
            
            {session.isShared && (
              <div style={{ 
                backgroundColor: '#e7f3ff', 
                border: '1px solid #b3d7ff', 
                padding: '10px', 
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Share this session:</strong> Give others the Session ID above to join this browser session.
                </p>
              </div>
            )}
            
            {/* Hyperbeam Container */}
            <div 
              ref={containerRef}
              style={{ 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                backgroundColor: '#000',
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                width: isFullscreen ? '100vw' : '100%',
                height: isFullscreen ? '100vh' : '600px',
                zIndex: isFullscreen ? 9999 : 1
              }}
            >
              {!hyperbeamClient && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: 'white',
                  fontSize: '16px'
                }}>
                  Loading Hyperbeam SDK...
                </div>
              )}
              
              {/* Fallback iframe if SDK fails */}
              <iframe
                ref={iframeRef}
                src={session.embedUrl}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none', 
                  borderRadius: '4px',
                  display: hyperbeamClient ? 'none' : 'block'
                }}
                title="Virtual Browser"
              />
            </div>
          </div>
        )}
        
        {/* Join Session Modal */}
        {showJoinModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '400px'
            }}>
              <h3 style={{ marginTop: 0 }}>Join Shared Session</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Session ID:
                </label>
                <input
                  type="text"
                  value={joinSessionId}
                  onChange={(e) => setJoinSessionId(e.target.value)}
                  placeholder="Enter session ID..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={joinSharedSession}
                  disabled={loading || !joinSessionId.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: (loading || !joinSessionId.trim()) ? 0.6 : 1
                  }}
                >
                  {loading ? 'Joining...' : 'Join Session'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinSessionId('');
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
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
                error: error,
                hyperbeamClient: hyperbeamClient ? 'loaded' : 'not loaded',
                isFullscreen: isFullscreen
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </>
  );
}