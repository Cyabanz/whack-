// Pure JavaScript Hyperbeam Client
// Based on: https://docs.hyperbeam.com/rest-api/dispatch/start-chromium-session

export function createHyperbeamClient() {
  const apiKey = process.env.HYPERBEAM_API_KEY;
  const baseUrl = 'https://engine.hyperbeam.com/v0';
  
  if (!apiKey) {
    throw new Error('HYPERBEAM_API_KEY environment variable is required');
  }

  return {
    async createSession(options = {}) {
      // Simple configuration from Hyperbeam docs
      const config = {
        start_url: options.start_url || 'https://jmw-v7.pages.dev',
        width: 1280,
        height: 720,
        ublock: true,
        region: 'NA'
      };

      console.log('Creating Hyperbeam session...');
      
      const response = await fetch(`${baseUrl}/vm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      console.log('Hyperbeam response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hyperbeam error:', errorText);
        throw new Error(`Hyperbeam API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Session created:', data.session_id);
      
      return data;
    },

    async terminateSession(sessionId) {
      try {
        const response = await fetch(`${baseUrl}/vm/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        return response.ok;
      } catch (error) {
        console.error('Failed to terminate session:', error);
        return false;
      }
    }
  };
}