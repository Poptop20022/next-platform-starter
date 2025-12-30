// Netlify Function wrapper for Express-like API
// This file routes all /api/* requests to appropriate handlers

import { router } from '../../backend/src/netlify-router.js';

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Route the request
    const result = await router(event, context);
    
    return {
      statusCode: result.statusCode || 200,
      headers: {
        ...headers,
        ...result.headers,
      },
      body: JSON.stringify(result.body),
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
          statusCode: error.statusCode || 500,
        },
      }),
    };
  }
};

