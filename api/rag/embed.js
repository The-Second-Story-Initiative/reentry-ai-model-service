// Embedding via @xenova/transformers feature-extraction with mean pooling
// CommonJS wrapper using dynamic import for ESM module

let _pipePromise = null;

async function getPipeline(modelName) {
  if (!_pipePromise) {
    _pipePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline('feature-extraction', modelName || 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return _pipePromise;
}

function meanPool(arr) {
  // arr: [tokens][dims]
  if (!arr || !arr.length) return [];
  const dims = arr[0].length;
  const out = new Array(dims).fill(0);
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    for (let j = 0; j < dims; j++) out[j] += row[j];
  }
  for (let j = 0; j < dims; j++) out[j] /= arr.length;
  return out;
}

function l2norm(vec) {
  let s = 0;
  for (const v of vec) s += v * v;
  return Math.sqrt(s) || 1;
}

function normalize(vec) {
  const n = l2norm(vec);
  return vec.map((v) => v / n);
}

async function embedTexts(texts, modelName) {
  const extractor = await getPipeline(modelName);
  const out = [];
  for (const t of texts) {
    const result = await extractor(t, { pooling: 'none', normalize: false });
    // result.data: [tokens, dims]
    const vec = meanPool(result.data);
    out.push(normalize(vec));
  }
  return out;
}

module.exports = { embedTexts };

