async function handler(req, res) {
  console.log('Test endpoint called');
  res.status(200).json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    method: req.method
  });
}

module.exports = handler;