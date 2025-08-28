const express = require('express');
const { embedTexts } = require('../rag/embed');
const { topKByCosine } = require('../rag/vectorStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.query || '').toString();
    const state = req.query.state ? req.query.state.toString().toUpperCase() : undefined;
    const k = Math.max(1, Math.min(50, parseInt(req.query.k || '5', 10)));
    if (!q) return res.status(400).json({ ok: false, error: 'query is required' });

    const [queryVec] = await embedTexts([q], process.env.EMBED_MODEL);
    const results = await topKByCosine(req.app.locals.vectors, queryVec, { k, state });

    res.json({
      ok: true,
      results: results.map(r => ({
        title: r.title,
        source: r.source,
        state: r.state,
        excerpt: r.chunk.slice(0, 300),
        score: r._score,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

