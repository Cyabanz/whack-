export default async function handler(req, res) {
  console.log('=== BASIC DEBUG TEST ===');
  console.log('Method:', req.method);
  console.log('Time:', new Date().toISOString());
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const testData = {
      success: true,
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        hasHyperbeamKey: !!process.env.HYPERBEAM_API_KEY,
        keyLength: process.env.HYPERBEAM_API_KEY ? process.env.HYPERBEAM_API_KEY.length : 0
      }
    };
    
    console.log('Sending test response:', testData);
    res.status(200).json(testData);
  } catch (error) {
    console.error('Basic debug error:', error);
    res.status(500).json({ 
      error: 'Basic test failed',
      details: error.message 
    });
  }
}