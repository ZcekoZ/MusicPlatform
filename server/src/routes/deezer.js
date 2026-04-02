
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/search', async (req, res) => {
  const q = req.query.q;
  try {
    const response = await axios.get(`https://api.deezer.com/search?q=${q}`);
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: 'Deezer fetch failed' });
  }
});

module.exports = router;
