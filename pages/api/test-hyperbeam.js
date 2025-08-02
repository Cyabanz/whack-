export default async function handler(req, res) {
  console.log('=== HYPERBEAM API TEST ===');
  
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
        error: 'No Hyperbeam API key configured',
        hasKey: false
      });
    }
    
    console.log('API Key Info:', {
      exists: !!apiKey,
      length: apiKey.length,
      prefix: apiKey.substring(0, 10) + '...',
      suffix: '...' + apiKey.substring(apiKey.length - 4)
    });
    
    // Test 1: Simple minimal request
    console.log('Testing minimal Hyperbeam request...');
    const minimalResponse = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    console.log('Minimal request status:', minimalResponse.status);
    const minimalText = await minimalResponse.text();
    console.log('Minimal response:', minimalText);
    
    let minimalResult = {
      status: minimalResponse.status,
      ok: minimalResponse.ok,
      response: minimalText
    };
    
    // Test 2: Our current configuration
    console.log('Testing our current configuration...');
    const ourConfigResponse = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        width: 1280,
        height: 720,
        ublock: true,
        start_url: 'https://jmw-v7.pages.dev',
        timeout: {
          offline: 600,
          inactive: 30,
          warning: 10
        },
        fps: 30,
        webgl: false,
        region: "NA"
      })
    });
    
    console.log('Our config status:', ourConfigResponse.status);
    const ourConfigText = await ourConfigResponse.text();
    console.log('Our config response:', ourConfigText);
    
    let ourConfigResult = {
      status: ourConfigResponse.status,
      ok: ourConfigResponse.ok,
      response: ourConfigText
    };
    
    // Test 3: Basic working configuration from docs
    console.log('Testing basic docs configuration...');
    const docsConfigResponse = await fetch('https://engine.hyperbeam.com/v0/vm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_url: 'https://google.com'
      })
    });
    
    console.log('Docs config status:', docsConfigResponse.status);
    const docsConfigText = await docsConfigResponse.text();
    console.log('Docs config response:', docsConfigText);
    
    let docsConfigResult = {
      status: docsConfigResponse.status,
      ok: docsConfigResponse.ok,
      response: docsConfigText
    };
    
    res.status(200).json({
      message: 'Hyperbeam API tests completed',
      apiKey: {
        exists: !!apiKey,
        length: apiKey.length,
        prefix: apiKey.substring(0, 10) + '...',
        type: apiKey.startsWith('sk_') ? 'Standard API Key' : 'Unknown format'
      },
      tests: {
        minimal: minimalResult,
        ourConfig: ourConfigResult,
        docsConfig: docsConfigResult
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Hyperbeam test error:', error);
    res.status(500).json({
      error: 'Hyperbeam test failed',
      details: error.message,
      stack: error.stack
    });
  }
}