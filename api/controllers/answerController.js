const fetch = require('node-fetch');
const { embedTexts } = require('../rag/embed');
const { topKByCosine } = require('../rag/vectorStore');

function containsCrisis(text, terms) {
  const t = (text || '').toLowerCase();
  return terms.some((w) => t.includes(w));
}

exports.answerController = async (req, res, next) => {
  try {
    const { question, state } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    // Crisis safety check
    if (containsCrisis(question, req.app.locals.CRISIS_TERMS)) {
      return res.json({
        ok: true,
        answer: 'It sounds like you may be going through a very difficult time. You are not alone and help is available 24/7. Please call or text 988 (Suicide & Crisis Lifeline). If you are in immediate danger, call 911. If you prefer, I can connect you with a human from our team.',
        citations: [],
        crisis: true,
      });
    }

    const k = parseInt(process.env.TOP_K || '6', 10) || 6;
    const [queryVec] = await embedTexts([question], process.env.EMBED_MODEL);
    const results = await topKByCosine(req.app.locals.vectors, queryVec, { k, state: state ? String(state).toUpperCase() : undefined });

    // Build grounded prompt
    const contextParts = results.map((r, i) => `[${i + 1}] (${r.source}) ${r.chunk}`);
    const system = 'Answer clearly with Next Steps and cite sources by their bracketed number.';
    const user = `Question: ${question}\n\nContext:\n${contextParts.join('\n\n')}`;

    const payload = {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      extra: { temperature: 0.2, max_tokens: 600 },
    };

    const rsp = await fetch(req.app.locals.MODEL_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!rsp.ok) throw new Error(`model-service error: ${rsp.status}`);
    const data = await rsp.json();

    const citations = results.map((r) => ({
      title: r.title,
      source: r.source,
      state: r.state,
      excerpt: r.chunk.slice(0, 300),
    }));

    return res.json({ ok: true, answer: data.text || data.answer || '', citations });
  } catch (err) {
    next(err);
  }
};

