const { createCorsResponse } = require('./utils/cors');

exports.handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return createCorsResponse(event);
  }

  // Get the actual campaigns-advanced function
  const campaignsAdvanced = require('./campaigns-advanced');

  // Call the actual handler
  return campaignsAdvanced.handler(event, context);
};