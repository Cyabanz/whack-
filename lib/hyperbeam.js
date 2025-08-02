// Hyperbeam VM Integration
class HyperbeamClient {
  constructor() {
    this.apiKey = process.env.HYPERBEAM_API_KEY || '';
    this.baseUrl = 'https://engine.hyperbeam.com/v0';
    
    if (!this.apiKey) {
      throw new Error('HYPERBEAM_API_KEY environment variable is required');
    }
  }

  async createSession(config = {}) {
    const defaultConfig = {
      width: 1280,
      height: 720,
      ublock: true,
      autoplay: false,
      start_url: 'https://jmw-v7.pages.dev',
      ...config
    };



    try {
      const response = await fetch(`${this.baseUrl}/vm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultConfig),
      });

      if (!response.ok) {
        const errorText = await response.text();
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
      throw new Error('Failed to create virtual machine session');
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