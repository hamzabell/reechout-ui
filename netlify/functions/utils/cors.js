/**
 * CORS utility helper for Netlify functions
 * Provides consistent CORS headers across all functions
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-User-ID'
};

/**
 * Adds CORS headers to a response object
 * @param {Object} response - The response object
 * @param {Object} event - The event object (optional, for dynamic origin handling)
 * @returns {Object} Response object with CORS headers
 */
function addCorsHeaders(response = {}, event = null) {
  let origin;
  let credentials;

  // In development, allow the specific origin from the request
  if (event && event.headers) {
    const requestOrigin = event.headers.origin || event.headers.Origin;
    if (requestOrigin && (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1'))) {
      origin = requestOrigin;
      credentials = 'true'; // Allow credentials for specific origins
    } else if (requestOrigin) {
      // For production or specific origins, allow the specific origin
      origin = requestOrigin;
      credentials = 'true';
    } else {
      // If no origin, use wildcard without credentials
      origin = '*';
      credentials = 'false';
    }
  } else {
    // When no event, use wildcard without credentials
    origin = '*';
    credentials = 'false';
  }

  const headers = {
    ...response.headers,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': CORS_HEADERS['Access-Control-Allow-Methods'],
    'Access-Control-Allow-Headers': CORS_HEADERS['Access-Control-Allow-Headers']
  };

  // Only add credentials header if it's 'true'
  if (credentials === 'true') {
    headers['Access-Control-Allow-Credentials'] = credentials;
  }

  return {
    ...response,
    headers
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
