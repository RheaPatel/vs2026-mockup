/**
 * Cloudflare Worker for GitHub OAuth Device Flow
 *
 * Deploy this worker to Cloudflare and update the OAUTH_PROXY_URL in app.js
 *
 * To deploy:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Deploy and copy the worker URL
 * 5. Update GITHUB_OAUTH.proxyUrl in app.js with your worker URL
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');

    // Validate endpoint
    const allowedEndpoints = {
      'device_code': 'https://github.com/login/device/code',
      'access_token': 'https://github.com/login/oauth/access_token',
    };

    if (!endpoint || !allowedEndpoints[endpoint]) {
      return new Response('Invalid endpoint', { status: 400 });
    }

    try {
      const body = await request.json();

      // Forward the request to GitHub
      const githubResponse = await fetch(allowedEndpoints[endpoint], {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await githubResponse.json();

      return new Response(JSON.stringify(data), {
        status: githubResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
