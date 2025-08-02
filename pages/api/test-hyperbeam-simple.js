export default async function handler(req, res) {
  console.log('=== SIMPLE HYPERBEAM TEST ===');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const apiKey = process.env.HYPERBEAM_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        error: 'No API key'
      });
    }
    
    console.log('Testing super simple request...');
    
    // Test with absolute minimum - just start_url
    const response = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_url: 'https://google.com'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    let responseText;
    try {
      responseText = await response.text();
      console.log('Response body:', responseText);
    } catch (textError) {
      console.log('Could not read response body:', textError);
      responseText = 'Could not read response';
    }
    
    // Try to parse as JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = responseText;
    }
    
    res.status(200).json({
      apiKeyInfo: {
        exists: !!apiKey,
        length: apiKey.length,
        format: apiKey.startsWith('sk_') ? 'sk_ format' : 'other format',
        prefix: apiKey.substring(0, 15) + '...'
      },
      hyperbeamResponse: {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}