// Vercel Serverless Function for GitHub OAuth Device Flow
// Deploy this to Vercel and update proxyUrl in app.js

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint } = req.query;

  // Validate endpoint
  const allowedEndpoints = {
    'device_code': 'https://github.com/login/device/code',
    'access_token': 'https://github.com/login/oauth/access_token',
  };

  if (!endpoint || !allowedEndpoints[endpoint]) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    // Forward the request to GitHub
    const githubResponse = await fetch(allowedEndpoints[endpoint], {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await githubResponse.json();
    return res.status(githubResponse.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
