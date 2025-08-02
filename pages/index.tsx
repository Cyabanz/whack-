import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import HyperbeamClient from '../components/HyperbeamClient';
import SessionManager from '../components/SessionManager';
import ErrorBoundary from '../components/ErrorBoundary';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchCSRFToken();
    checkExistingSession();
  }, []);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token');
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.token);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/session/status');
      if (response.ok) {
        const data = await response.json();
        if (data.hasSession) {
          setSession(data.session);
        }
      }
    } catch (error) {
      console.error('Failed to check session:', error);
    }
  };

  const createSession = async () => {
    if (!csrfToken) {
      setError('CSRF token not available. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession({
          id: data.sessionId,
          embedUrl: data.embedUrl,
          adminToken: data.adminToken,
          expiresAt: data.expiresAt,
          inactivityTimeout: data.inactivityTimeout,
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async () => {
    if (!csrfToken) return;

    try {
      const response = await fetch('/api/session/terminate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
                    <button
                      onClick={createSession}
                      disabled={loading || !csrfToken}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Creating Session...' : 'Start Virtual Browser'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Virtual Browser Session
                  </h2>
                  <button
                    onClick={terminateSession}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    End Session
                  </button>
                </div>
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
      </div>
    </ErrorBoundary>
  );
}