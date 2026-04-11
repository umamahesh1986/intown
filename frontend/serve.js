// Custom server to handle CORS for Emergent preview
const { spawn } = require('child_process');

// Set environment variable to disable CORS checks
process.env.EXPO_NO_DOTENV = '1';

// Start Expo with web flag
const expo = spawn('npx', ['expo', 'start', '--web', '--port', '3000', '--non-interactive'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BROWSER: 'none',
    CI: '1'
  }
});

expo.on('close', (code) => {
  process.exit(code);
});
