const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const { chunkText } = require('./chunk');
const { embedTexts } = require('./embed');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function indexAll() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reentry_ai';
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const vectors = db.collection('vectors');

  const guidesDir = path.join(__dirname, '..', 'data', 'guides');
  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith('.md'));
  let totalChunks = 0;
  let totalUpserts = 0;

  for (const file of files) {
    const full = path.join(guidesDir, file);
    const raw = fs.readFileSync(full, 'utf8');
    const title = (raw.split(/\r?\n/)[0] || path.basename(file, '.md')).trim();
    const state = (file.split('-')[0] || '').toUpperCase();
    const chunks = chunkText(raw);
    totalChunks += chunks.length;
    const embeddings = await embedTexts(chunks, process.env.EMBED_MODEL);

    for (let i = 0; i < chunks.length; i++) {
      const doc = { source: file, idx: i, title, state, chunk: chunks[i], embedding: embeddings[i], updatedAt: new Date() };
      const r = await vectors.updateOne({ source: file, idx: i }, { $set: doc }, { upsert: true });
      if (r.upsertedCount || r.modifiedCount) totalUpserts += 1;
    }
  }

  await client.close();
  return { files: files.length, chunks: totalChunks, upserts: totalUpserts };
}

if (require.main === module) {
  indexAll()
    .then((r) => {
      console.log(JSON.stringify({ ok: true, ...r }));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { indexAll };

