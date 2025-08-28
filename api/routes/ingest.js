const express = require('express');
const path = require('path');
const fs = require('fs');
const { chunkText } = require('../rag/chunk');
const { embedTexts } = require('../rag/embed');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const guidesDir = path.join(__dirname, '..', 'data', 'guides');
    const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));
    let totalChunks = 0;
    let totalUpserts = 0;

    for (const file of files) {
      const full = path.join(guidesDir, file);
      const raw = fs.readFileSync(full, 'utf8');
      const lines = raw.split(/\r?\n/);
      const title = (lines[0] || path.basename(file, '.md')).trim();
      const state = (file.split('-')[0] || '').toUpperCase();
      const chunks = chunkText(raw);
      totalChunks += chunks.length;

      const embeddings = await embedTexts(chunks, process.env.EMBED_MODEL);

      for (let i = 0; i < chunks.length; i++) {
        const doc = {
          source: file,
          title,
          state,
          chunk: chunks[i],
          embedding: embeddings[i],
          updatedAt: new Date(),
        };
        const r = await req.app.locals.vectors.updateOne(
          { source: file, idx: i },
          { $set: { ...doc, idx: i } },
          { upsert: true }
        );
        if (r.upsertedCount || r.modifiedCount) totalUpserts += 1;
      }
    }

    res.json({ ok: true, files: files.length, chunks: totalChunks, upserts: totalUpserts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

