// Quick test script to verify server works locally before deploying
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working!',
    ready: true
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Test server running!`);
  console.log(`🌐 Visit: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
