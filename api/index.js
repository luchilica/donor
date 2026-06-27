// Vercel Serverless Function acting as a dynamic reverse proxy to the Railway backend
export default async function handler(req, res) {
  // 1. Determine the backend target URL from env variables
  let targetBase = process.env.VITE_API_URL || process.env.BACKEND_URL;

  if (!targetBase) {
    // If no custom backend is defined, use the default backup or return a helpful diagnostic
    targetBase = 'https://donor-production.up.railway.app';
    console.warn('VITE_API_URL or BACKEND_URL environment variables not defined on Vercel. Falling back to default:', targetBase);
  }

  // 2. Normalize backend target URL
  if (targetBase.endsWith('/')) {
    targetBase = targetBase.slice(0, -1);
  }

  // Determine the target URL for this request
  let targetUrl;
  const reqUrl = req.url || '';
  
  if (targetBase.endsWith('/api')) {
    // If targetBase is e.g. "https://your-backend.up.railway.app/api", replace the leading "/api" from req.url
    const relativePath = reqUrl.startsWith('/api') ? reqUrl.substring(4) : reqUrl;
    targetUrl = targetBase + relativePath;
  } else {
    // If targetBase is e.g. "https://your-backend.up.railway.app" and req.url starts with "/api"
    if (reqUrl.startsWith('/api')) {
      targetUrl = targetBase + reqUrl;
    } else {
      targetUrl = targetBase + '/api' + reqUrl;
    }
  }

  // 3. Set up request headers for proxying
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    // Skip headers that should be handled by Vercel/the target server
    if (['host', 'connection', 'content-length', 'x-forwarded-for', 'x-forwarded-proto'].includes(key.toLowerCase())) {
      continue;
    }
    headers[key] = value;
  }

  // 4. Configure fetch request options
  const options = {
    method: req.method,
    headers,
  };

  // If there's a request body, forward it
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body !== undefined) {
    if (typeof req.body === 'object') {
      options.body = JSON.stringify(req.body);
      options.headers['content-type'] = 'application/json';
    } else {
      options.body = req.body;
    }
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.arrayBuffer();

    // Set response headers received from backend
    for (const [key, value] of response.headers.entries()) {
      if (['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        continue;
      }
      res.setHeader(key, value);
    }

    // Set standard CORS headers to be absolutely safe
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    console.error('[Vercel API Proxy Error]:', error);
    res.status(502).json({
      error: 'Gateway Error',
      message: 'Failed to connect to the Railway backend. Please check your Vercel Environment Variables (VITE_API_URL or BACKEND_URL).',
      details: error.message,
      configuredTarget: targetBase
    });
  }
}
