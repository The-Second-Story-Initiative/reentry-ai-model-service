const { MongoClient } = require('mongodb');

async function connect(uri) {
  const client = new MongoClient(uri, { maxPoolSize: 10 });
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

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

async function topKByCosine(vectorsCol, queryVec, { k = 5, state } = {}) {
  const filter = state ? { state } : {};
  const cursor = vectorsCol.find(filter, { projection: { embedding: 1, title: 1, source: 1, state: 1, chunk: 1 } });
  const arr = await cursor.toArray();
  for (const r of arr) {
    r._score = cosine(queryVec, r.embedding);
  }
  arr.sort((a, b) => b._score - a._score);
  return arr.slice(0, k);
}

module.exports = { connect, cosine, topKByCosine };

