// server.js
const express = require('express');
const path = require('path');

const app2 = express();
const PORT = 3000;

// Serve React build files
app2.use(express.static(path.join(__dirname, 'public')));

// Route all other requests to index.html
app2.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app2.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
