// Hyperbeam API Client - Based on Official Documentation
// https://docs.hyperbeam.com/rest-api/dispatch/start-chromium-session

class HyperbeamClient {
  constructor() {
    this.apiKey = process.env.HYPERBEAM_API_KEY;
    this.baseUrl = 'https://engine.hyperbeam.com/v0';
    
    if (!this.apiKey) {
      throw new Error('HYPERBEAM_API_KEY environment variable is required');
    }
  }

  async createSession(options = {}) {
    // Default configuration based on Hyperbeam docs
    const config = {
      start_url: options.start_url || 'https://jmw-v7.pages.dev',
      width: options.width || 1280,
      height: options.height || 720,
      ublock: options.ublock !== undefined ? options.ublock : true,
      region: options.region || 'NA',
      fps: options.fps || 30,
      webgl: options.webgl !== undefined ? options.webgl : false,
      ...options
    };

    try {
      console.log('Creating Hyperbeam session with config:', config);
      
      const response = await fetch(`${this.baseUrl}/vm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      console.log('Hyperbeam response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hyperbeam API error:', errorText);
        throw new Error(`Hyperbeam API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Hyperbeam session created successfully');
      
      return {
        session_id: data.session_id,
        embed_url: data.embed_url,
        admin_token: data.admin_token
      };
    } catch (error) {
      console.error('Failed to create Hyperbeam session:', error);
      throw error;
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
      console.error('Failed to terminate session:', error);
      return false;
    }
  }

  async getSession(sessionId) {
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
      console.error('Failed to get session:', error);
      return null;
    }
  }
}

module.exports = { HyperbeamClient };