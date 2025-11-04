#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Start the API server and capture the port
const apiProcess = spawn('npm', ['run', 'api'], { stdio: 'pipe' });

let port = null;

apiProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  // Extract port from the output like "Local dev server ready: http://localhost:52411"
  const portMatch = output.match(/Local dev server ready: http:\/\/localhost:(\d+)/);
  if (portMatch && !port) {
    port = portMatch[1];
    console.log(`\n🚀 API Server started on port: ${port}`);

    // Update the frontend API configuration
    const apiServicePath = path.join(__dirname, '../src/services/apiService.ts');
    let content = fs.readFileSync(apiServicePath, 'utf8');

    // Replace the port in the API_BASE_URL
    content = content.replace(
      /const API_BASE_URL = process\.env\.NODE_ENV === 'development'\s*\?\s*'http:\/\/localhost:\d+\/\.netlify\/functions'/,
      `const API_BASE_URL = process.env.NODE_ENV === 'development'\n  ? 'http://localhost:${port}/.netlify/functions'`
    );

    fs.writeFileSync(apiServicePath, content);
    console.log(`✅ Updated frontend API configuration to use port ${port}`);
  }
});

apiProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

apiProcess.on('close', (code) => {
  console.log(`API server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...');
  apiProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down API server...');
  apiProcess.kill('SIGTERM');
  process.exit(0);
});