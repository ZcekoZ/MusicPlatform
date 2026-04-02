
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const userId = 1;
  const { name } = req.body;

  const result = await db.query(
    'INSERT INTO playlists (user_id, name) VALUES ($1,$2) RETURNING *',
    [userId, name]
  );

  res.json(result.rows[0]);
});

router.get('/', async (req, res) => {
  const userId = 1;
  const result = await db.query('SELECT * FROM playlists WHERE user_id=$1', [userId]);
  res.json(result.rows);
});

module.exports = router;
