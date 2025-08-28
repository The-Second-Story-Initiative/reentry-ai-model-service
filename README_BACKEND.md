# Reentry-AI Backend Runbook

This repo contains two services:
- `model-service/`: OpenAI-compatible gateway already running on `http://localhost:7071/generate`.
- `api/`: RAG service with MongoDB vector memory that calls `model-service` to answer.

## Quick Start

1) Start MongoDB + UI
```
docker compose up -d
```

2) Start model-service
```
cd model-service
cp .env.example .env   # set provider+key as needed
npm i
npm run dev
curl http://localhost:7071/health
```

3) Start api
```
cd api
cp .env.example .env
npm i
npm run dev
curl http://localhost:7072/health
```

4) Sanity-check model-service
```
./scripts/test-model.sh
```

5) Seed demo guides into memory
```
./api/scripts/seed-demo.sh
```

6) Ask a question
```
./scripts/test-answer.sh
```

## Notes
- Switch LLM providers by editing `model-service/.env` only; `api` always calls `MODEL_SERVICE_URL`.
- Mongo Express UI at `http://localhost:8081` (admin/admin).
- Safety: `/answer` detects crisis keywords (e.g., "suicide") and routes to 988 with a supportive message.

## Roadmap
- MCP server for tools (resources, referrals, reminders) behind the API.
- AuthN/Z for admin endpoints.
- Automated evaluations for safety/grounding.
- Admin dashboard to verify sources and view audit logs.

