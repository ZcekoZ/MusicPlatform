
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/:trackId', async (req, res) => {
  const userId = 1;
  const { trackId } = req.params;

  await db.query(
    'INSERT INTO likes (user_id, track_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [userId, trackId]
  );

  res.sendStatus(200);
});

router.get('/', async (req, res) => {
  const userId = 1;
  const result = await db.query(
    `SELECT * FROM likes WHERE user_id=$1`,
    [userId]
  );

  res.json(result.rows);
});

module.exports = router;
