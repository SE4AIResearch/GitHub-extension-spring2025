// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// Route all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
