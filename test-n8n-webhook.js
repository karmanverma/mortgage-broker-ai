#!/usr/bin/env node

// Simple test script to verify n8n webhook is working
import https from 'https';
import http from 'http';

const WEBHOOK_URL = 'https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat';

const testPayload = {
  userId: 'test-user-123',
  userEmail: 'test@example.com',
  sessionId: 'test-session-456',
  message: 'Hello, this is a test message from the test script',
  history: [
    { sender: 'user', message: 'Previous test message' },
    { sender: 'ai', message: 'Previous AI response' }
  ],
  context: {
    selectedClientId: 'test-client-id',
    selectedLenderIds: ['test-lender-1', 'test-lender-2'],
    selectedDocumentIds: ['test-doc-1']
  }
};

console.log('🚀 Testing n8n webhook...');
console.log('URL:', WEBHOOK_URL);
console.log('Payload:', JSON.stringify(testPayload, null, 2));

const postData = JSON.stringify(testPayload);

const url = new URL(WEBHOOK_URL);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Accept': 'application/json'
  },
  timeout: 30000
};

const client = url.protocol === 'https:' ? https : http;

const req = client.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('📋 Response Headers:', res.headers);

  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log('📄 Response Body:', responseBody);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log('✅ SUCCESS: Webhook responded successfully');
        console.log('🤖 AI Response:', jsonResponse.output || 'No output field found');
      } catch (e) {
        console.log('⚠️  SUCCESS: Webhook responded but response is not JSON');
      }
    } else {
      console.log('❌ ERROR: Webhook returned error status');
    }
  });
});

req.on('error', (error) => {
  console.error('💥 Request Error:', error.message);
  if (error.code === 'ENOTFOUND') {
    console.error('🌐 DNS resolution failed - check the webhook URL');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('🔌 Connection refused - webhook server may be down');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('⏰ Request timed out - webhook server may be slow');
  }
});

req.on('timeout', () => {
  console.error('⏰ Request timed out after 30 seconds');
  req.destroy();
});

req.write(postData);
req.end();

console.log('⏳ Waiting for response...');
