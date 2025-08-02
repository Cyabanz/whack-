import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import HyperbeamClient from '../components/HyperbeamClient';
import SessionManager from '../components/SessionManager';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchCSRFToken();
    // Only check for existing session if we're not in the middle of creating one
    if (!isCreatingSession) {
      checkExistingSession();
    }
  }, [isCreatingSession]);

  // Keep session alive with heartbeat
  useEffect(() => {
    if (session && !isCreatingSession) {
      const heartbeatInterval = setInterval(async () => {
        try {
          await fetch('/api/session/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken
            }
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }, 10000); // Every 10 seconds

      return () => clearInterval(heartbeatInterval);
    }
  }, [session, csrfToken, isCreatingSession]);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.token);
        setError(null); // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('CSRF token error:', response.status, errorData);
        setError(`Security token error (${response.status}): ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      setError('Network error: Unable to get security token. Please check your connection.');
    }
  };

  const checkExistingSession = async () => {
    try {
      console.log('Checking for existing session...');
      const response = await fetch('/api/session/status');
      if (response.ok) {
        const data = await response.json();
        console.log('Session status response:', data);
        if (data.hasSession) {
          console.log('Found existing session, setting state:', data.session);
          setSession(data.session);
        } else {
          console.log('No existing session found');
          // Only clear session if we're not currently creating one
          if (!isCreatingSession) {
            setSession(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check session:', error);
    }
  };

  const createSession = async (isShared = false, joinSessionId = null) => {
    setLoading(true);
    setError(null);
    setIsCreatingSession(true);
    
    // Try to get CSRF token if not available
    let tokenToUse = csrfToken;
    if (!tokenToUse) {
      try {
        await fetchCSRFToken();
        tokenToUse = csrfToken;
        
        // If still no token after fetching, try one more time
        if (!tokenToUse) {
          const response = await fetch('/api/csrf-token');
          if (response.ok) {
            const data = await response.json();
            tokenToUse = data.token;
            setCsrfToken(data.token);
          } else {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        setError('Unable to get security token. Please refresh the page and try again.');
        setLoading(false);
        return;
      }
    }

    try {
              const response = await fetch('/api/debug-session-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': tokenToUse,
          },
        body: JSON.stringify({
          isShared,
          joinSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session created successfully:', data);
        const sessionData = {
          id: data.sessionId,
          embedUrl: data.embedUrl,
          adminToken: data.adminToken,
          expiresAt: data.expiresAt,
          inactivityTimeout: data.inactivityTimeout,
          isShared: data.isShared,
          connectedIPs: data.connectedIPs,
          connectedCount: data.connectedCount,
          isJoining: data.isJoining,
          createdAt: Date.now(),
          lastActivity: Date.now()
        };
        console.log('Setting session state:', sessionData);
        setSession(sessionData);
        
        if (joinSessionId) {
          setShowJoinModal(false);
          setJoinSessionId('');
        }
        
        // Prevent immediate session status check for a few seconds
        setTimeout(() => {
          setIsCreatingSession(false);
        }, 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create session');
        setIsCreatingSession(false);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Network error. Please try again.');
      setIsCreatingSession(false);
    } finally {
      setLoading(false);
    }
  };

  const joinSharedSession = async () => {
    if (!joinSessionId.trim()) {
      setError('Please enter a valid session ID');
      return;
    }
    await createSession(false, joinSessionId.trim());
  };

  const terminateSession = async () => {
    // Get current CSRF token or fetch new one
    let tokenToUse = csrfToken;
    if (!tokenToUse) {
      try {
        const response = await fetch('/api/csrf-token');
        if (response.ok) {
          const data = await response.json();
          tokenToUse = data.token;
          setCsrfToken(data.token);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token for termination:', error);
        return;
      }
    }

    try {
      const response = await fetch('/api/session/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': tokenToUse,
        },
      });

      if (response.ok) {
        setSession(null);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <Head>
          <title>Hyperbeam VM - Secure Virtual Browser</title>
          <meta name="description" content="Secure Hyperbeam VM with session management and CSRF protection" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Hyperbeam VM
              </h1>
              <div className="flex items-center space-x-4">
                {session && (
                  <SessionManager 
                    session={session} 
                    onSessionExpired={() => setSession(null)}
                    csrfToken={csrfToken}
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Debug Info (Mobile)</summary>
                    <pre className="text-xs mt-1 bg-red-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify({
                        timestamp: new Date().toISOString(),
                        csrfToken: csrfToken ? 'present' : 'missing',
                        session: session ? 'present' : 'missing',
                        loading: loading,
                        isCreatingSession: isCreatingSession,
                        error: error
                      }, null, 2)}
                    </pre>
                    
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/debug-basic');
                            const data = await response.json();
                            alert('Basic API Test: ' + JSON.stringify(data, null, 2));
                          } catch (err) {
                            alert('Basic API Error: ' + err.message);
                          }
                        }}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                      >
                        Test API
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/csrf-token');
                            const data = await response.json();
                            alert('CSRF Test: ' + JSON.stringify(data, null, 2));
                          } catch (err) {
                            alert('CSRF Error: ' + err.message);
                          }
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        Test CSRF
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/test-hyperbeam');
                            const data = await response.json();
                            alert('Hyperbeam Test: ' + JSON.stringify(data, null, 2));
                          } catch (err) {
                            alert('Hyperbeam Error: ' + err.message);
                          }
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                      >
                        Test Hyperbeam
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            if (!csrfToken) {
                              const tokenResponse = await fetch('/api/csrf-token');
                              const tokenData = await tokenResponse.json();
                              if (!tokenResponse.ok) throw new Error(tokenData.error);
                              setCsrfToken(tokenData.token);
                            }
                            
                            const response = await fetch('/api/session/create-demo', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-Token': csrfToken
                              }
                            });
                            const data = await response.json();
                            if (response.ok) {
                              alert('Demo Session Created: ' + JSON.stringify(data, null, 2));
                            } else {
                              alert('Demo Error: ' + JSON.stringify(data, null, 2));
                            }
                          } catch (err) {
                            alert('Demo Error: ' + err.message);
                          }
                        }}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                      >
                        Try Demo
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/test-hyperbeam-simple');
                            const data = await response.json();
                            alert('Simple Test: ' + JSON.stringify(data, null, 2));
                          } catch (err) {
                            alert('Simple Test Error: ' + err.message);
                          }
                        }}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                      >
                        Simple HB Test
                      </button>
                    </div>
                  </details>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!session ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Start Virtual Browser Session
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Create a secure virtual browser session with automatic timeout protection.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h3 className="font-medium text-blue-900 text-sm">Security Features:</h3>
                      <ul className="text-xs text-blue-800 mt-1 space-y-1">
                        <li>• 10-minute session limit</li>
                        <li>• 30-second inactivity timeout</li>
                        <li>• CSRF token protection</li>
                        <li>• Rate limiting (10 requests/minute)</li>
                      </ul>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => createSession(false)}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Creating Session...' : 'Start Private Browser'}
                      </button>
                      
                      <button
                        onClick={() => createSession(true)}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Creating Session...' : 'Start Shared Browser'}
                      </button>
                      
                      <button
                        onClick={() => setShowJoinModal(true)}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Join Shared Session
                      </button>
                    </div>
                    
                    {!csrfToken && !error && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                        🔄 Loading security token...
                      </div>
                    )}
                    
                    {!csrfToken && !error && (
                      <div className="mt-2">
                        <button
                          onClick={fetchCSRFToken}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        >
                          Retry Token Fetch
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {session.isShared ? 'Shared Virtual Browser' : 'Private Virtual Browser'}
                    </h2>
                    {session.isShared && (
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Session ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{session.id}</span></p>
                        <p>Connected Users: {session.connectedCount}</p>
                        {session.isJoining && <p className="text-green-600">✓ Successfully joined shared session</p>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={terminateSession}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    {session.isShared ? 'Leave Session' : 'End Session'}
                  </button>
                </div>
                
                {session.isShared && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <h3 className="font-medium text-blue-900 text-sm">Share this session:</h3>
                    <p className="text-xs text-blue-800 mt-1">
                      Share the Session ID above with others to let them join this browser session.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <HyperbeamClient 
                  embedUrl={session.embedUrl}
                  onError={(error) => setError(error)}
                />
              </div>
            </div>
          )}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-500 text-sm">
              Secure Hyperbeam VM with session management and CSRF protection
            </p>
          </div>
        </footer>

        {/* Join Session Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Join Shared Session
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    id="sessionId"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    placeholder="Enter session ID to join..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={joinSharedSession}
                    disabled={loading || !joinSessionId.trim()}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Joining...' : 'Join Session'}
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinModal(false);
                      setJoinSessionId('');
                      setError(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}