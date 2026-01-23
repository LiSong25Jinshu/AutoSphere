// Simple test to check if the server can be imported
console.log('Starting simple test...');

try {
  process.env.NODE_ENV = 'test';
  console.log('Environment set to test');
  
  import('./src/server.js').then(() => {
    console.log('Server imported successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('Error importing server:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Error in test:', error);
  process.exit(1);
}