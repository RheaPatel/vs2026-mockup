/**
 * Cloudflare Worker for GitHub OAuth + Copilot API Proxy
 *
 * Handles:
 * 1. OAuth Device Flow (device_code, access_token)
 * 2. Copilot token exchange (copilot_token)
 * 3. Copilot chat completions proxy (copilot_chat) — streams SSE
 *
 * To deploy:
 * 1. Go to https://dash.cloudflare.com/
 * 2. Create a new Worker
 * 3. Paste this code
 * 4. Deploy and copy the worker URL
 * 5. Update GITHUB_OAUTH.proxyUrl in app.js with your worker URL
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint');

    // Route to the appropriate handler
    if (endpoint === 'copilot_token') {
      return handleCopilotToken(request);
    }
    if (endpoint === 'copilot_chat') {
      return handleCopilotChat(request);
    }

    // OAuth Device Flow endpoints
    const oauthEndpoints = {
      'device_code': 'https://github.com/login/device/code',
      'access_token': 'https://github.com/login/oauth/access_token',
    };

    if (!endpoint || !oauthEndpoints[endpoint]) {
      return new Response('Invalid endpoint', { status: 400 });
    }

    try {
      const body = await request.json();
      const githubResponse = await fetch(oauthEndpoints[endpoint], {
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
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};

// Exchange GitHub OAuth token for a short-lived Copilot session token
async function handleCopilotToken(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const response = await fetch('https://api.github.com/copilot_internal/v2/token', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': 'VS2026-Mockup/1.0',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: `Copilot token error: ${response.status}`, details: text }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}

// Proxy chat completions to Copilot API, streaming SSE back to browser
async function handleCopilotChat(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const body = await request.text();

    const copilotResponse = await fetch('https://api.githubcopilot.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Editor-Version': 'vscode/1.85.0',
        'Editor-Plugin-Version': 'copilot-chat/0.12.0',
        'Openai-Organization': 'github-copilot',
        'Copilot-Integration-Id': 'vscode-chat',
        'User-Agent': 'VS2026-Mockup/1.0',
      },
      body,
    });

    if (!copilotResponse.ok) {
      const text = await copilotResponse.text();
      return new Response(JSON.stringify({ error: `Copilot API error: ${copilotResponse.status}`, details: text }), {
        status: copilotResponse.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Stream the SSE response back to the browser
    return new Response(copilotResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
