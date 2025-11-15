const { createCorsResponse, createSuccessResponse, createErrorResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Check if this is a request to /campaigns/advanced
  const path = event.path.replace('/.netlify/functions', '');

  if (path === '/campaigns/advanced') {
    // Forward to the campaigns-advanced function
    const campaignsAdvanced = require('./campaigns-advanced');
    return campaignsAdvanced.handler(event, context);
  }

  // Return 404 for other paths
  return createErrorResponse('Function not found', 404, event);
};