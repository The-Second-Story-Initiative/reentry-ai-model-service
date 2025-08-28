const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { MongoClient } = require('mongodb');

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 7072;
const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || 'http://localhost:7071/generate';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reentry_ai';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.locals.CRISIS_TERMS = [
  'suicide',
  'kill myself',
  'self harm',
  'overdose',
  'end my life',
];

async function connectMongo() {
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 3000,
  });
  await client.connect();
  const db = client.db();
  const vectors = db.collection('vectors');
  const docs = db.collection('docs');
  await Promise.all([
    vectors.createIndex({ state: 1 }),
    vectors.createIndex({ source: 1 }),
  ]);
  return { client, db, vectors, docs };
}

app.get('/health', async (req, res) => {
  let mongo = false;
  try {
    await app.locals.db.command({ ping: 1 });
    mongo = true;
  } catch (_) {}
  res.json({ ok: true, api: 'reentry-api', modelService: MODEL_SERVICE_URL, mongo });
});

app.use('/ingest', require('./routes/ingest'));
app.use('/search', require('./routes/search'));
app.use('/answer', require('./routes/answer'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Server error' });
});

(async () => {
  try {
    const { client, db, vectors, docs } = await connectMongo();
    app.locals.mongoClient = client;
    app.locals.db = db;
    app.locals.vectors = vectors;
    app.locals.docs = docs;
    app.locals.MODEL_SERVICE_URL = MODEL_SERVICE_URL;
    app.locals.EMBED_MODEL = process.env.EMBED_MODEL || 'Xenova/all-MiniLM-L6-v2';

    app.listen(PORT, () => {
      console.log(`Reentry-AI API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start API:', err);
    process.exit(1);
  }
})();

module.exports = app;

