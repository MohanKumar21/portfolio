const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  // For now, always return the same dummy response
  res.json({
    completion: `Echo: "${message}" (This is a mock response from the backend.)`
  });
});

app.listen(PORT, () => {
  console.log(`Backend API listening at http://localhost:${PORT}/api/chat`);
});
