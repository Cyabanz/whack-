import React, { useState, useEffect, useCallback } from 'react';

interface SessionManagerProps {
  session: any;
  onSessionExpired: () => void;
  csrfToken: string | null;
}

const SessionManager: React.FC<SessionManagerProps> = ({ 
  session, 
  onSessionExpired, 
  csrfToken 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);

  // Send heartbeat to keep session alive
  const sendHeartbeat = useCallback(async () => {
    if (!csrfToken) return false;

    try {
      const response = await fetch('/api/session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimeRemaining(data.timeRemaining);
        setLastActivity(Date.now() - data.lastActivity);
        return true;
      } else if (response.status === 401) {
        // Session expired
        onSessionExpired();
        return false;
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
    return false;
  }, [csrfToken, onSessionExpired]);

  // Track user activity
  const trackActivity = useCallback(() => {
    sendHeartbeat();
  }, [sendHeartbeat]);

  useEffect(() => {
    if (!session) return;

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    // Initial heartbeat
    sendHeartbeat();

    // Regular heartbeat every 10 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 10000);

    // Update timer every second
    const timerInterval = setInterval(() => {
      if (session.expiresAt) {
        const remaining = Math.max(0, session.expiresAt - Date.now());
        setTimeRemaining(remaining);
        
        // Show warning in last 2 minutes
        setIsWarning(remaining < 2 * 60 * 1000 && remaining > 0);

        if (remaining === 0) {
          onSessionExpired();
        }
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      clearInterval(heartbeatInterval);
      clearInterval(timerInterval);
    };
  }, [session, sendHeartbeat, trackActivity, onSessionExpired]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatActivityTime = (ms: number): string => {
    if (ms < 1000) return 'now';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (!session) return null;

  return (
    <div className="flex items-center space-x-4 text-sm">
      {/* Session Timer */}
      <div className={`flex items-center space-x-1 ${isWarning ? 'text-red-600' : 'text-gray-600'}`}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono">
          {formatTime(timeRemaining)}
        </span>
        {isWarning && (
          <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
            Session ending soon!
          </span>
        )}
      </div>

      {/* Activity Indicator */}
      <div className="flex items-center space-x-1 text-gray-500">
        <div className={`w-2 h-2 rounded-full ${lastActivity < 5000 ? 'bg-green-500' : lastActivity < 15000 ? 'bg-yellow-500' : 'bg-red-500'}`} />
        <span className="text-xs">
          Active {formatActivityTime(lastActivity)}
        </span>
      </div>

      {/* Session ID (for debugging) */}
      <div className="text-xs text-gray-400 font-mono hidden md:block">
        ID: {session.id.slice(0, 8)}...
      </div>
    </div>
  );
};

export default SessionManager;