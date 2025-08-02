// Hyperbeam VM Integration
class HyperbeamClient {
  constructor() {
    this.apiKey = process.env.HYPERBEAM_API_KEY || '';
    this.baseUrl = 'https://engine.hyperbeam.com/v0';
    
    if (!this.apiKey) {
      throw new Error('HYPERBEAM_API_KEY environment variable is required');
    }
    
    // Log API key info for debugging (without exposing the key)
    console.log('Hyperbeam client initialized:', {
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey.length,
      keyPrefix: this.apiKey.substring(0, 8) + '...',
      baseUrl: this.baseUrl
    });
  }

  async createSession(config = {}) {
    const defaultConfig = {
      width: 1280,
      height: 720,
      ublock: true,
      start_url: 'https://jmw-v7.pages.dev',
      // Timeout configuration per Hyperbeam docs
      timeout: {
        offline: 600, // 10 minutes offline timeout (when no users connected) - matches our session limit
        inactive: 30, // 30 seconds inactive timeout (no user input)
        warning: 10   // 10 seconds warning before timeout
      },
      // Additional quality and performance settings
      fps: 30,
      webgl: false, // Disable WebGL for better compatibility
      region: "NA", // North America region
      ...config
    };



    try {
      console.log('Making Hyperbeam API request:', {
        url: `${this.baseUrl}/vm`,
        config: defaultConfig
      });
      
      const response = await fetch(`${this.baseUrl}/vm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultConfig),
      });

      console.log('Hyperbeam API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hyperbeam API error response:', errorText);
        throw new Error(`Hyperbeam API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      return {
        embed_url: data.embed_url,
        session_id: data.session_id,
        admin_token: data.admin_token,
      };
    } catch (error) {
      console.error('Failed to create Hyperbeam session:', error);
      // Preserve the original error details for better debugging
      if (error.message.includes('Hyperbeam API error:')) {
        throw error; // Re-throw the detailed API error
      }
      throw new Error(`Failed to create virtual machine session: ${error.message}`);
    }
  }

  async terminateSession(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/vm/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to terminate Hyperbeam session:', error);
      return false;
    }
  }

  async getSessionInfo(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/vm/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }
}

module.exports = { HyperbeamClient };