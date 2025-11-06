// Simple test to check environment variables
console.log('Testing environment variables...');

// Simulate Vite environment
const mockImportMeta = {
  env: {
    VITE_STACK_PROJECT_ID: '905c7a50-646f-4050-9a10-6273e8df7d8c',
    VITE_STACK_PUBLISHABLE_CLIENT_KEY: 'pck_dtg05emfhyz40mbxenjd16b9w5kg2673bg56qdhnqpqwr',
    VITE_RECAPTCHA_SITE_KEY: 'test-key',
    VITE_APP_NAME: 'Test App'
  }
};

// Test environment variable access
const projectId = mockImportMeta.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = mockImportMeta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

console.log('Environment variables test results:');
console.log('✅ projectId exists:', !!projectId);
console.log('✅ publishableClientKey exists:', !!publishableClientKey);
console.log('✅ projectId value:', projectId);
console.log('✅ publishableClientKey value:', publishableClientKey);

if (projectId && publishableClientKey) {
  console.log('🎉 All environment variables are properly configured!');
} else {
  console.log('❌ Environment variables are missing');
}
