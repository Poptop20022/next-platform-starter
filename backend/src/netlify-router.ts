// Netlify Functions router - адаптер для Express routes
import { Request, Response, NextFunction } from 'express';
import { setupRoutes } from './routes/index.js';
import express from 'express';

// Create Express app for routing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup all routes
setupRoutes(app);

// Convert Express request to Netlify event format
function expressToNetlify(event: any, context: any) {
  const url = new URL(event.path, `https://${event.headers.host || 'localhost'}`);
  
  return {
    method: event.httpMethod,
    url: event.path,
    path: event.path,
    query: Object.fromEntries(url.searchParams),
    headers: event.headers || {},
    body: event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {},
    ip: event.headers['x-forwarded-for'] || context.clientContext?.custom?.netlify?.identity?.url || '',
  };
}

// Convert Express response to Netlify response
function createResponse() {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body: any = null;

  const res: any = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      body = data;
      return res;
    },
    send: (data: any) => {
      body = data;
      return res;
    },
    setHeader: (key: string, value: string) => {
      headers[key] = value;
      return res;
    },
    getHeader: (key: string) => headers[key],
    statusCode,
  };

  return { res, getResult: () => ({ statusCode, headers, body }) };
}

export async function router(event: any, context: any) {
  const expressReq = expressToNetlify(event, context);
  const { res, getResult } = createResponse();

  // Create Express-like request object
  const req: any = {
    ...expressReq,
    params: {},
    query: expressReq.query,
    body: expressReq.body,
    headers: expressReq.headers,
    get: (name: string) => expressReq.headers[name.toLowerCase()],
    ip: expressReq.ip,
  };

  // Extract route params from path
  const pathParts = event.path.split('/').filter(Boolean);
  if (pathParts.length >= 3 && pathParts[0] === 'api') {
    // Extract dynamic params like :id, :tenderId, etc.
    const routeParts = pathParts.slice(1);
    const routeName = routeParts[0];
    
    // Try to match routes and extract params
    if (routeParts.length > 1) {
      req.params.id = routeParts[routeParts.length - 1];
      if (routeName === 'tenders') {
        req.params.tenderId = routeParts[1];
      } else if (routeName === 'lots') {
        if (routeParts[1] === 'tender') {
          req.params.tenderId = routeParts[2];
        } else {
          req.params.id = routeParts[1];
        }
      } else if (routeName === 'positions') {
        if (routeParts[1] === 'lot') {
          req.params.lotId = routeParts[2];
        } else if (routeParts[1] === 'import') {
          req.params.lotId = routeParts[2];
        } else {
          req.params.id = routeParts[1];
        }
      } else if (routeName === 'quotes') {
        if (routeParts[1] === 'tender') {
          req.params.tenderId = routeParts[2];
        } else if (routeParts[1] === 'lot') {
          req.params.lotId = routeParts[2];
        } else if (routeParts.length > 2 && routeParts[2] === 'submit') {
          req.params.id = routeParts[1];
        } else {
          req.params.id = routeParts[1];
        }
      } else if (routeName === 'attachments') {
        if (routeParts[1] === 'tender') {
          req.params.tenderId = routeParts[2];
        } else if (routeParts[1] === 'lot') {
          req.params.lotId = routeParts[2];
        } else if (routeParts[1] === 'quote') {
          req.params.quoteId = routeParts[2];
        } else if (routeParts[1] === 'download') {
          req.params.id = routeParts[0];
        } else {
          req.params.id = routeParts[1];
        }
      } else if (routeName === 'comparison') {
        if (routeParts[1] === 'lot') {
          req.params.lotId = routeParts[2];
          if (routeParts[3] === 'export') {
            req.params.export = true;
          }
        }
      } else if (routeName === 'documents') {
        if (routeParts[1] === 'tender') {
          req.params.tenderId = routeParts[2];
          req.params.documentType = routeParts[3];
        }
      }
    }
  }

  // Handle file uploads (multipart/form-data)
  if (event.headers['content-type']?.includes('multipart/form-data')) {
    // Netlify Functions handle file uploads differently
    // Files are available in event.body if processed by Netlify
    req.file = event.body?.file;
    req.files = event.body?.files;
  }

  return new Promise((resolve, reject) => {
    let handled = false;

    // Wrap Express handlers
    const next = (err?: any) => {
      if (handled) return;
      handled = true;

      if (err) {
        reject(err);
      } else {
        resolve(getResult());
      }
    };

    // Try to match route
    app._router?.handle(req, res, next);
    
    // Fallback if no route matched
    setTimeout(() => {
      if (!handled) {
        handled = true;
        resolve({
          statusCode: 404,
          headers: {},
          body: { error: { message: 'Not found', statusCode: 404 } },
        });
      }
    }, 100);
  });
}

