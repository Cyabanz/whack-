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
  const [isMockMode, setIsMockMode] = useState(false);
  
  const scriptStatus = useScript('https://unpkg.com/@hyperbeam/web@latest/dist/index.js');

  useEffect(() => {
    if (!embedUrl || !containerRef.current || isInitialized) return;

    const initializeHyperbeam = async () => {
      try {
        // Check if this is mock mode
        if (embedUrl.includes('demo.hyperbeam.com')) {
          setIsMockMode(true);
          setIsInitialized(true);
          setIsLoading(false);
          
          // Add mock content
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: system-ui;">
                <div style="text-align: center; padding: 2rem;">
                  <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">🚀 Mock Hyperbeam Session</h2>
                  <p style="margin-bottom: 1rem; opacity: 0.9;">This is a demo session for development.</p>
                  <p style="font-size: 0.9rem; opacity: 0.7;">Add your HYPERBEAM_API_KEY to use real sessions.</p>
                  <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <p style="font-size: 0.8rem;">Session Features Working:</p>
                    <p style="font-size: 0.8rem;">✅ CSRF Protection ✅ Rate Limiting ✅ Session Management</p>
                  </div>
                </div>
              </div>
            `;
          }
          return;
        }

        if (scriptStatus !== 'ready') return;

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
        
        // Initialize Hyperbeam
        const hb = await Hyperbeam(containerRef.current, embedUrl);

        hyperbeamRef.current = hb;
        setIsInitialized(true);
        setIsLoading(false);

        // Set up event listeners
        if (hb.tabs && hb.tabs.onUpdated) {
          hb.tabs.onUpdated.addListener((tabId, changeInfo) => {
            console.log('Tab updated:', tabId, changeInfo);
          });
        }

        // Volume control
        if (hb.volume !== undefined) {
          hb.volume = 0.8;
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

        <div className="text-xs text-gray-500">
          Script: {scriptStatus} | VM: {isInitialized ? 'ready' : 'loading'}
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
          className="w-full bg-white hyperbeam-container"
          style={{ 
            height: '720px',
            minHeight: '600px'
          }}
        />
      </div>
    </div>
  );
};

export default HyperbeamClient;