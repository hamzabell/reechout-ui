// CORS headers for Netlify Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Handle preflight OPTIONS requests
function handleCors() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: ''
  };
}

// Add CORS headers to response
function addCorsHeaders(response) {
  return {
    ...response,
    headers: {
      ...corsHeaders,
      ...(response.headers || {})
    }
  };
}

module.exports = {
  corsHeaders,
  handleCors,
  addCorsHeaders
};