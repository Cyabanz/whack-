export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.HYPERBEAM_API_KEY;
    
    // Don't expose the full key for security, just show format info
    const keyInfo = {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
      lastUpdated: new Date().toISOString()
    };

    // Test the API key with a minimal request to Hyperbeam
    if (apiKey) {
      try {
        console.log('Testing Hyperbeam API key...');
        const response = await fetch('https://engine.hyperbeam.com/v0/vm', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        console.log('Hyperbeam API response status:', response.status);
        
        const responseText = await response.text();
        console.log('Hyperbeam API response body:', responseText);

        keyInfo.testResult = {
          status: response.status,
          statusText: response.statusText,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 100)
        };
      } catch (testError) {
        console.error('Error testing API key:', testError);
        keyInfo.testResult = {
          error: testError.message,
          type: testError.name
        };
      }
    }

    res.status(200).json({
      message: 'Environment debug info',
      apiKey: keyInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug failed',
      details: error.message
    });
  }
}