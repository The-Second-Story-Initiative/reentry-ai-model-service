// Chunk text by paragraphs first, then length limit, to preserve meaning.

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/) // blank-line separated
    .map(s => s.trim())
    .filter(Boolean);
}

function chunkText(text, maxChars = 1200) {
  const paras = splitParagraphs(text);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    // If paragraph alone exceeds max, hard-split it
    if (p.length >= maxChars) {
      if (buf) { chunks.push(buf.trim()); buf = ''; }
      for (let i = 0; i < p.length; i += maxChars) {
        chunks.push(p.slice(i, i + maxChars));
      }
      continue;
    }
    if ((buf + '\n\n' + p).trim().length <= maxChars) {
      buf = buf ? `${buf}\n\n${p}` : p;
    } else {
      if (buf) chunks.push(buf.trim());
      buf = p;
    }
  }
  if (buf) chunks.push(buf.trim());
  return chunks;
}

module.exports = { chunkText };

