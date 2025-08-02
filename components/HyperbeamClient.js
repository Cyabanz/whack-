import React, { useEffect, useRef, useState } from 'react';

// Custom hook to load external scripts
const useScript = (src) => {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setStatus('ready');
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.type = 'module';
    script.async = true;

    script.onload = () => setStatus('ready');
    script.onerror = () => setStatus('error');

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [src]);

  return status;
};

const HyperbeamClient = ({ embedUrl, onError }) => {
  const containerRef = useRef(null);
  const hyperbeamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const scriptStatus = useScript('https://unpkg.com/@hyperbeam/web@latest/dist/index.js');

  useEffect(() => {
    if (scriptStatus !== 'ready' || !embedUrl || !containerRef.current || isInitialized) return;

    const initializeHyperbeam = async () => {
      try {

        // Wait for global Hyperbeam to be available
        let attempts = 0;
        while (!window.Hyperbeam && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.Hyperbeam) {
          throw new Error('Hyperbeam library failed to load');
        }

        if (!containerRef.current) return;

        const Hyperbeam = window.Hyperbeam;
        
        // Initialize Hyperbeam with proper options per documentation
        const hb = await Hyperbeam(containerRef.current, embedUrl, {
          timeout: 5000, // 5 second connection timeout
          volume: 0.8,   // Default volume at 80%
          videoPaused: false,
          delegateKeyboard: true,
          onDisconnect: (e) => {
            console.log('Hyperbeam disconnected:', e.type);
            if (e.type === 'inactive') {
              onError('Session ended due to inactivity (30 seconds)');
            } else if (e.type === 'request') {
              onError('Session was manually terminated');
            } else {
              onError('Connection to virtual browser lost');
            }
          },
          onConnectionStateChange: (e) => {
            console.log('Connection state changed:', e.state);
            if (e.state === 'reconnecting') {
              setIsLoading(true);
            } else if (e.state === 'playing') {
              setIsLoading(false);
            }
          }
        });

        hyperbeamRef.current = hb;
        setIsInitialized(true);
        setIsLoading(false);

        // Set up event listeners
        if (hb.tabs && hb.tabs.onUpdated) {
          hb.tabs.onUpdated.addListener((tabId, changeInfo) => {
            console.log('Tab updated:', tabId, changeInfo);
          });
        }

      } catch (error) {
        console.error('Failed to initialize Hyperbeam:', error);
        onError('Failed to load virtual browser. Please try again.');
        setIsLoading(false);
      }
    };

    initializeHyperbeam();

    // Cleanup
    return () => {
      if (hyperbeamRef.current) {
        try {
          hyperbeamRef.current.destroy?.();
        } catch (error) {
          console.error('Error destroying Hyperbeam instance:', error);
        }
      }
    };
  }, [scriptStatus, embedUrl, onError, isInitialized]);

  useEffect(() => {
    if (scriptStatus === 'error') {
      onError('Failed to load Hyperbeam library. Please check your connection.');
      setIsLoading(false);
    }
  }, [scriptStatus, onError]);

  const handleReload = () => {
    if (hyperbeamRef.current && hyperbeamRef.current.tabs) {
      hyperbeamRef.current.tabs.reload();
    }
  };

  const handleGoBack = () => {
    if (hyperbeamRef.current && hyperbeamRef.current.tabs) {
      hyperbeamRef.current.tabs.goBack();
    }
  };

  const handleGoForward = () => {
    if (hyperbeamRef.current && hyperbeamRef.current.tabs) {
      hyperbeamRef.current.tabs.goForward();
    }
  };

  const handleNavigate = (url) => {
    if (hyperbeamRef.current && hyperbeamRef.current.tabs) {
      hyperbeamRef.current.tabs.update({ url });
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const isReady = scriptStatus === 'ready' && isInitialized;

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={handleGoBack}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ← Back
          </button>
          <button
            onClick={handleGoForward}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Forward →
          </button>
          <button
            onClick={handleReload}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Reload
          </button>
        </div>
        
        <div className="flex-1 flex space-x-2">
          <button
            onClick={() => handleNavigate('https://google.com')}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Google
          </button>
          <button
            onClick={() => handleNavigate('https://youtube.com')}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            YouTube
          </button>
          <button
            onClick={() => handleNavigate('https://github.com')}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            GitHub
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleFullscreen}
            disabled={isLoading || !isReady}
            className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 15v4.5M15 15h4.5M15 15l5.5 5.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15H4.5M9 15v4.5M9 15l-5.5 5.5" />
                </svg>
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>Fullscreen</span>
              </>
            )}
          </button>
          
          <div className="text-xs text-gray-500">
            Script: {scriptStatus} | VM: {isInitialized ? 'ready' : 'loading'}
          </div>
        </div>
      </div>

      {/* Hyperbeam Container */}
      <div className="relative">
        {(isLoading || scriptStatus === 'loading') && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {scriptStatus === 'loading' ? 'Loading Hyperbeam library...' : 'Initializing virtual browser...'}
              </p>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          className={`w-full bg-white hyperbeam-container ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
          style={{ 
            height: isFullscreen ? '100vh' : '720px',
            minHeight: isFullscreen ? '100vh' : '600px'
          }}
        />
      </div>
    </div>
  );
};

export default HyperbeamClient;