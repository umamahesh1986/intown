const { execSync } = require('child_process');
process.env.BROWSER = 'none';
process.env.CI = '1';
execSync('npx expo start --web --port 3000 --non-interactive', { stdio: 'inherit' });
