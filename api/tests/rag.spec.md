RAG Manual Test Checklist

- Ingest
  - POST /ingest returns ok with non-zero files, chunks, and upserts.
- Search
  - GET /search?query=Arizona%20ID&state=AZ returns items with title/source/excerpt/score.
- Answer
  - POST /answer with AZ ID question returns answer text and citations array.
- Crisis routing
  - POST /answer with question containing "suicide" returns crisis message and crisis: true.

