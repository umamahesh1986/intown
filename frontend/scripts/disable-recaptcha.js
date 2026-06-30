/**
 * Script to disable reCAPTCHA Enterprise for Firebase Phone Auth.
 * 
 * Run this ONCE with:
 *   node scripts/disable-recaptcha.js
 * 
 * Prerequisites:
 *   1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
 *   2. Login: gcloud auth application-default login
 *   3. Set project: gcloud config set project intown-dev-d4661
 * 
 * OR use curl directly (see instructions at bottom)
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'intown-dev-d4661';

async function getAccessToken() {
  try {
    const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf-8' }).trim();
    return token;
  } catch (error) {
    console.error('Failed to get access token. Make sure gcloud CLI is installed and authenticated.');
    console.error('Run: gcloud auth application-default login');
    process.exit(1);
  }
}

function makeRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Getting access token...');
  const token = await getAccessToken();

  console.log('Fetching current config...');
  const currentConfig = await makeRequest(
    'GET',
    `/v2/projects/${PROJECT_ID}/config`,
    token
  );

  console.log('Current reCAPTCHA config:', JSON.stringify(currentConfig.recaptchaConfig, null, 2));

  console.log('Disabling reCAPTCHA Enterprise for phone auth...');
  const updateBody = {
    recaptchaConfig: {
      ...(currentConfig.recaptchaConfig || {}),
      phoneEnforcementState: 'OFF',
      useSmsBotScore: false,
    },
  };

  const result = await makeRequest(
    'PATCH',
    `/v2/projects/${PROJECT_ID}/config?updateMask=recaptchaConfig`,
    token,
    updateBody
  );

  if (result.recaptchaConfig) {
    console.log('Updated reCAPTCHA config:', JSON.stringify(result.recaptchaConfig, null, 2));
    console.log('reCAPTCHA Enterprise for phone auth has been DISABLED.');
  } else {
    console.log('Response:', JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);

/*
 * ALTERNATIVE: Use curl directly
 * 
 * Step 1: Get access token
 *   gcloud auth application-default print-access-token
 * 
 * Step 2: Check current config
 *   curl -X GET \
 *     "https://identitytoolkit.googleapis.com/v2/projects/intown-dev-d4661/config" \
 *     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
 * 
 * Step 3: Disable reCAPTCHA
 *   curl -X PATCH \
 *     "https://identitytoolkit.googleapis.com/v2/projects/intown-dev-d4661/config?updateMask=recaptchaConfig" \
 *     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"recaptchaConfig":{"phoneEnforcementState":"OFF","useSmsBotScore":false}}'
 */
