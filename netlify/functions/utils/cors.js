/**
 * CORS utility helper for Netlify functions
 * Provides consistent CORS headers across all functions
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true' || !process.env.NODE_ENV
    ? '*' // Allow all origins in development
    : 'https://your-production-domain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Allow-Credentials': true
};

/**
 * Adds CORS headers to a response object
 * @param {Object} response - The response object
 * @param {Object} event - The event object (optional, for dynamic origin handling)
 * @returns {Object} Response object with CORS headers
 */
function addCorsHeaders(response = {}, event = null) {
  let origin = CORS_HEADERS['Access-Control-Allow-Origin'];

  // In development, allow the specific origin from the request
  if (event && event.headers && event.headers.origin) {
    const requestOrigin = event.headers.origin;
    if (requestOrigin && requestOrigin.includes('localhost')) {
      origin = requestOrigin;
    }
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': CORS_HEADERS['Access-Control-Allow-Methods'],
      'Access-Control-Allow-Headers': CORS_HEADERS['Access-Control-Allow-Headers'],
      'Access-Control-Allow-Credentials': CORS_HEADERS['Access-Control-Allow-Credentials']
    }
  };
}

/**
 * Creates a CORS preflight response for OPTIONS requests
 * @param {Object} event - The event object (optional, for dynamic origin handling)
 * @returns {Object} CORS preflight response
 */
function createCorsResponse(event = null) {
  return addCorsHeaders({
    statusCode: 200,
    body: ''
  }, event);
}

/**
 * Creates a successful response with data and CORS headers
 * @param {Object} data - The response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} event - The event object (optional, for dynamic origin handling)
 * @returns {Object} Response with CORS headers
 */
function createSuccessResponse(data, statusCode = 200, event = null) {
  return addCorsHeaders({
    statusCode,
    body: JSON.stringify(data)
  }, event);
}

/**
 * Creates an error response with CORS headers
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} event - The event object (optional, for dynamic origin handling)
 * @returns {Object} Error response with CORS headers
 */
function createErrorResponse(error, statusCode = 500, event = null) {
  return addCorsHeaders({
    statusCode,
    body: JSON.stringify({ error })
  }, event);
}

module.exports = {
  CORS_HEADERS,
  addCorsHeaders,
  createCorsResponse,
  createSuccessResponse,
  createErrorResponse
};