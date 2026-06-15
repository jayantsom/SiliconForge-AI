<div align="center">

# ⚗️ SiliconForge AI

### Autonomous Multi-Agent Research Platform for Semiconductor Manufacturing

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-FF6B35?style=flat-square)](https://langchain-ai.github.io/langgraph/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Ollama-llama3.1:8b-000000?style=flat-square)](https://ollama.ai)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*Type a research question → AI agents plan, retrieve literature, critique the findings, and synthesize a structured report — all streamed live to your browser.*

</div>

---

## 📖 Table of Contents

- [Why This Project?](#-why-this-project)
- [What It Does](#-what-it-does)
- [Use Cases](#-use-cases)
- [What Makes It Unique](#-what-makes-it-unique)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Agent Pipeline](#-agent-pipeline)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [Online / Production Deployment](#-online--production-deployment)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [MCP Servers](#-mcp-servers)
- [Adding New Domains](#-adding-new-semiconductor-domains)
- [Future Scope](#-future-scope)
- [License](#-license)
- [Author](#-author)

---

## 🧠 Why This Project?

Semiconductor process engineering is one of the most knowledge-intensive fields in modern technology. A process engineer designing a FinFET gate stack or an ALD deposition recipe needs to synthesize information from dozens of research papers, validate findings against physical fabrication constraints, and produce actionable experiment plans — a process that can take days.

**SiliconForge AI automates this entire research-to-report pipeline.**

Unlike generic AI assistants that hallucinate unconstrained answers, SiliconForge AI applies domain-specific physical constraints as a validation layer. If a proposed process violates silicon's melting point, exceeds a thermal budget ceiling, or specifies an impossible etch selectivity ratio, the critique agent detects it and forces re-planning.

> This project demonstrates how **agentic AI systems with structured reasoning loops** can accelerate deep technical research — not by replacing engineers, but by giving them a validated, citable first draft in minutes instead of days.

---

## ✅ What It Does

A researcher types a natural-language semiconductor research question. The system then:

1. **Plans** — Decomposes the query into targeted ArXiv search keywords and a 3-step research strategy
2. **Retrieves** — Searches a local ChromaDB vector store (curated semiconductor papers) and the live ArXiv API in parallel, then merges and deduplicates results
3. **Critiques** — Validates the technical summary against physical manufacturing constraints (melting points, thermal budgets, etch selectivity ratios, ALD process windows)
4. **Iterates** — If the critique verdict is `fail`, re-plans and re-retrieves (up to 2 iterations)
5. **Synthesizes** — Generates a complete structured Markdown research report with Executive Summary, Literature Analysis, Validated Hypothesis, Experiment Plan, and References
6. **Streams** — Delivers all of this live to a professional dark-mode UI via Server-Sent Events

---

## 🏭 Use Cases

| Domain | Example Query | What You Get |
|--------|--------------|-------------|
| **Gate Stack Engineering** | *"What is the optimal thermal budget for FinFET gate-last integration with HfO₂ high-k dielectrics?"* | Full experiment plan with temperature windows, equipment list, and risk factors |
| **Etch Process Development** | *"What plasma etch chemistry achieves >10:1 SiN:SiO₂ selectivity for FinFET spacer processes?"* | Chemistry candidates, selectivity data from literature, validated constraints |
| **ALD Process Optimization** | *"How does ALD cycle count affect HfO₂ interfacial layer quality in gate stack formation?"* | Literature synthesis with specific cycle count–thickness relationships |
| **Materials Research** | *"Compare TaN and TiN as metal gate materials for sub-3nm node devices"* | Comparative analysis across electrical, thermal, and process compatibility dimensions |
| **Yield Analysis** | *"What are the primary defect mechanisms in EUV lithography double patterning?"* | Root cause taxonomy with detection and mitigation strategies |
| **R&D Acceleration** | Any new process node investigation | Validated, citable first draft in minutes — not days |

**Where it fits:**
- 🏢 Semiconductor R&D labs (Intel, TSMC, Samsung scale-down research)
- 🎓 University cleanroom research groups
- 🔬 Equipment manufacturers developing new process recipes
- 📊 Technical literature review and state-of-the-art assessments
- 🤖 Agentic AI research — as a reference implementation of multi-agent RAG with critique loops

---

## ⚡ What Makes It Unique

| Feature | SiliconForge AI | Generic AI Chat |
|---------|----------------|-----------------|
| **Domain constraint validation** | ✅ Physical violations detected & flagged | ❌ Will hallucinate impossible temperatures |
| **Iterative self-correction** | ✅ Re-plans if critique fails (up to 2x) | ❌ Single-shot response |
| **Dual retrieval** | ✅ Local vector store + live ArXiv | ❌ No retrieval / training cutoff |
| **Fully local inference** | ✅ Ollama — no API keys, no data leakage | ❌ Sends data to cloud |
| **Structured report output** | ✅ Consistent Markdown with 9 fixed sections | ❌ Freeform text |
| **Live streaming** | ✅ Per-node SSE progress stream | ❌ Waiting for full response |
| **Session persistence** | ✅ PostgreSQL history with agent trace | ❌ No persistence |
| **MCP-compatible** | ✅ Tools exposed as MCP servers | ❌ No tool ecosystem integration |

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology | Role |
|-------|-----------|------|
| **API Framework** | [FastAPI](https://fastapi.tiangolo.com) 0.115+ | REST API + Server-Sent Events streaming |
| **Agent Orchestration** | [LangGraph](https://langchain-ai.github.io/langgraph/) 0.2+ | Stateful multi-agent graph with conditional routing |
| **LLM Runtime** | [Ollama](https://ollama.ai) | Local LLM inference server |
| **LLM Model** | `llama3.1:8b` | Instruction-following + structured output |
| **LLM Client** | [LangChain Ollama](https://python.langchain.com/docs/integrations/llms/ollama/) | `with_structured_output()` for typed Pydantic responses |
| **Vector Store** | [ChromaDB](https://www.trychroma.com) 0.5+ | Semantic similarity search on semiconductor literature |
| **Database** | PostgreSQL 16 | Session persistence, agent trace history |
| **ORM** | [SQLAlchemy](https://www.sqlalchemy.org) 2.0 async | Async DB operations with `asyncpg` driver |
| **HTTP Client** | [httpx](https://www.python-httpx.org) | Async ArXiv API requests |
| **Tool Protocol** | [MCP](https://modelcontextprotocol.io) 1.0+ | Stdio MCP servers for external tool integration |
| **Package Manager** | [uv](https://docs.astral.sh/uv/) | Fast Python dependency management |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org) | Production-grade async server |

### Frontend

| Layer | Technology | Role |
|-------|-----------|------|
| **Framework** | [React](https://react.dev) 18 + TypeScript | Component-based UI |
| **Build Tool** | [Vite](https://vitejs.dev) | Fast dev server + HMR |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) v3 | Utility-first dark-mode design system |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm | Rendered Markdown reports |
| **Streaming** | Native `EventSource` API | Server-Sent Events client |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| **Containerisation** | Docker + Docker Compose |
| **Database** | PostgreSQL 16 Alpine (Docker) |
| **Local AI** | Ollama (host machine) |

---

## 🏗️ Architecture

```
                        ┌──────────────────────────────────┐
                        │         Browser :5173             │
                        │   React + TypeScript + Tailwind   │
                        │  EventSource (SSE) streaming       │
                        └────────────────┬─────────────────┘
                                         │ HTTP / SSE
                        ┌────────────────▼─────────────────┐
                        │        FastAPI Server :8000        │
                        │                                    │
                        │  POST /api/v1/research/start       │
                        │  GET  /api/v1/research/stream/{id} │
                        │  GET  /api/v1/research/history     │
                        │  GET  /api/v1/health               │
                        └────────────────┬─────────────────┘
                                         │
                        ┌────────────────▼─────────────────┐
                        │       LangGraph StateGraph         │
                        │                                    │
                        │  START ──► [planner]               │
                        │               │                    │
                        │           [retrieval]              │
                        │               │                    │
                        │           [critique] ──fail──►     │
                        │               │       (iter<2)  [planner]
                        │             pass                   │
                        │               │                    │
                        │           [synthesis] ──► END      │
                        └──┬────────────┴────────────────┬──┘
                           │                             │
              ┌────────────▼──────────┐   ┌─────────────▼──────────┐
              │  ChromaDB             │   │  ArXiv REST API          │
              │  (local vector store) │   │  export.arxiv.org        │
              │  semiconductor papers │   │  (live search)           │
              └───────────────────────┘   └────────────────────────┘
                           │
              ┌────────────▼──────────┐   ┌────────────────────────┐
              │  Ollama :11434         │   │  PostgreSQL :5432        │
              │  llama3.1:8b           │   │  Session persistence     │
              │  (local inference)     │   │  Agent trace history     │
              └───────────────────────┘   └────────────────────────┘
```

---

## 🤖 Agent Pipeline

Each node in the LangGraph `StateGraph` receives the full `ResearchState` and returns a partial state update.

### Node 1 — `planner`
**Input:** `user_query`
**Output:** `plan` (list of search keywords + strategy steps)

Uses `llama3.1:8b` with `with_structured_output(PlannerOutput)` to decompose the query into 3–5 targeted ArXiv keywords and 3 strategy steps. On parse error, gracefully degrades to using the raw query as the search term.

### Node 2 — `retrieval`
**Input:** `plan`, `user_query`
**Output:** `literature_context`, `raw_summary`

- Queries **ChromaDB** with the first 2 keywords (semantic similarity search)
- Queries **ArXiv API** asynchronously with all 5 keywords
- Deduplicates by title, merges up to 8 unique papers
- Passes the merged context to `llama3.1:8b` for a 3–5 paragraph technical synthesis

### Node 3 — `critique`
**Input:** `raw_summary`, `user_query`
**Output:** `critique_output` (`CritiqueResult`), `iteration_count`

Validates the summary against 4 hard physical constraints:
1. Silicon melting point ≤ 1414 °C
2. ALD window for HfO₂: 150–350 °C
3. Plasma etch selectivity > 5:1
4. FinFET gate-last thermal budget ≤ 500 °C post high-k deposition

Returns a structured `CritiqueResult` with `verdict` (`pass`/`fail`), `confidence_score` (0.0–1.0), `physical_violations`, and optional `failure_reason`.

### Routing — `route_after_critique`
- If `verdict == "fail"` and `iteration_count < 2` → loop back to `planner`
- Otherwise → proceed to `synthesis`

This prevents infinite loops while still allowing one full re-planning cycle.

### Node 4 — `synthesis`
**Input:** Full state (query, summary, critique result, literature context)
**Output:** `final_report` (structured Markdown)

Produces a complete research report with exactly 9 sections:
`Executive Summary` · `Literature Analysis` · `Validated Hypothesis` · `Proposed Experiment Plan` · `Equipment Required` · `Process Variables` · `Success Metrics` · `Risk Factors` · `References`

---

## 📁 Project Structure

```
silicon-forge-ai/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, SSE streaming endpoint
│   ├── config.py            # Pydantic settings (reads .env)
│   ├── database.py          # SQLAlchemy async models + DB helpers
│   ├── schemas.py           # API request/response Pydantic models
│   ├── agents/
│   │   ├── graph.py         # LangGraph StateGraph definition
│   │   ├── nodes.py         # Async agent node functions
│   │   └── state.py         # TypedDict state + Pydantic models
│   ├── tools/
│   │   ├── literature.py    # ChromaDB vector store tool
│   │   └── search.py        # Async ArXiv API tool
│   └── mcp_servers/
│       ├── literature_server.py   # MCP stdio server (ChromaDB)
│       └── search_server.py       # MCP stdio server (ArXiv)
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Root component, state management
│   │   ├── components/
│   │   │   ├── AgentTracePanel.tsx  # Live per-node trace UI
│   │   │   ├── HistorySidebar.tsx   # Session history panel
│   │   │   ├── QueryInput.tsx       # Research query form
│   │   │   └── ReportViewer.tsx     # Markdown report renderer
│   │   └── lib/
│   │       ├── api.ts              # SSE client + history fetch
│   │       └── types.ts            # TypeScript interfaces
│   ├── index.html
│   └── package.json
├── data/
│   └── sample_papers.json   # Curated semiconductor literature seed data
├── chroma_store/            # ChromaDB persistence (auto-created, git-ignored)
├── .env.example             # Environment variable template
├── .gitignore
├── docker-compose.yml       # PostgreSQL service
├── Dockerfile               # Backend container image
├── Makefile                 # Dev shortcuts
└── pyproject.toml           # Python project + uv dependencies
```

---

## 💻 Local Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | ≥ 3.11 | [python.org](https://python.org) |
| uv | latest | See Step 1 |
| Ollama | latest | [ollama.ai](https://ollama.ai) |
| Docker Desktop | latest | [docker.com](https://docker.com) |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |

---

### Step 1 — Install `uv`

**macOS / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Restart your terminal, then verify:
```bash
uv --version
```

---

### Step 2 — Clone the Repository

```bash
git clone https://github.com/your-username/silicon-forge-ai.git
cd silicon-forge-ai
```

---

### Step 3 — Pull the AI Model

```bash
ollama pull llama3.1:8b
```

> This downloads ~5 GB. Only required once.

---

### Step 4 — Configure Environment

```bash
cp .env.example .env
```

The defaults work out of the box for local development. See [Configuration](#-configuration) for all options.

---

### Step 5 — Install Dependencies

```bash
# Python backend
uv sync

# Node.js frontend (first time only)
cd frontend && npm install && cd ..
```

---

### Step 6 — Start PostgreSQL

```bash
docker compose up postgres -d
```

---

### Step 7 — Start the Backend

```bash
uv run uvicorn backend.main:app --reload --port 8000
```

Wait for:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> On first run, ChromaDB is automatically seeded from `data/sample_papers.json`.

---

### Step 8 — Start the Frontend (new terminal)

```bash
cd frontend
npm run dev
```

---

### Step 9 — Open the App

Visit **http://localhost:5173** in your browser.

Check all services are healthy: **http://localhost:8000/api/v1/health**

---

### Every Day After First Setup

```bash
# Terminal 1 — Database + Backend
docker compose up postgres -d
uv run uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

### Makefile Shortcuts

```bash
make install       # uv sync
make dev           # start API with hot reload
make ollama-pull   # ollama pull llama3.1:8b
```

---

## 🌐 Online / Production Deployment

### Option A — Docker Compose (Recommended for VPS/Cloud VM)

Ollama must run on the **host machine** (GPU or CPU). The backend container reaches it via `host.docker.internal:11434`.

```bash
# 1. SSH into your server
# 2. Install Ollama and pull the model
ollama pull llama3.1:8b

# 3. Clone the repo and set up environment
git clone https://github.com/your-username/silicon-forge-ai.git
cd silicon-forge-ai
cp .env.example .env
# Edit .env: set a strong DATABASE_URL password

# 4. Build and start the full stack
docker compose up --build -d
```

This starts:
- `postgres` container (PostgreSQL 16)
- `web` container (FastAPI on port 8000)

**Frontend:** Build and serve via your web server (Nginx/Caddy) or a CDN:
```bash
cd frontend
npm install && npm run build
# Serve the frontend/dist/ directory
```

---

### Option B — Platform-as-a-Service

| Component | Recommended Platform | Notes |
|-----------|---------------------|-------|
| **Backend API** | [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io) | Set env vars, deploy from Dockerfile |
| **PostgreSQL** | Railway / Render managed Postgres | Update `DATABASE_URL` in env |
| **Frontend** | [Vercel](https://vercel.com), [Netlify](https://netlify.com) | Point to `frontend/` directory |
| **Ollama** | Self-hosted GPU VM (AWS g4dn, GCP T4) | Cloud Ollama hosts like [Replicate](https://replicate.com) also supported |

**Environment variable to change for cloud Ollama:**
```bash
OLLAMA_BASE_URL=https://your-ollama-server.com
```

**CORS for production:** Update `allow_origins` in `backend/main.py`:
```python
allow_origins=["https://your-frontend-domain.com"]
```

---

### Option C — Kubernetes (Enterprise)

The backend Dockerfile produces a production image. Use the provided `docker-compose.yml` as a reference for pod specs. PostgreSQL can be replaced with any managed cloud Postgres (AWS RDS, Cloud SQL, Azure Database).

---

## ⚙️ Configuration

All configuration is via environment variables loaded from `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://siliconforge:siliconforge@localhost:5432/siliconforge` | PostgreSQL async connection string |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL (use `host.docker.internal:11434` inside Docker) |
| `OLLAMA_MODEL` | `llama3.1:8b` | Model name. Any instruction-following Ollama model works |
| `CHROMA_PERSIST_DIR` | `./chroma_store` | Directory for ChromaDB persistence |
| `ARXIV_MAX_RESULTS` | `5` | Max papers returned per ArXiv query |

### Switching LLM Models

Replace `OLLAMA_MODEL` with any model available via `ollama list`:

```bash
# Faster, lighter (4B params)
OLLAMA_MODEL=llama3.2:3b

# Higher quality (70B, requires ~40GB VRAM)
OLLAMA_MODEL=llama3.1:70b

# Code-optimized alternative
OLLAMA_MODEL=qwen2.5:7b
```

---

## 📡 API Reference

### `POST /api/v1/research/start`
Run the full agent pipeline synchronously and return the complete result.

**Request:**
```json
{ "query": "string", "session_id": "optional-uuid" }
```

**Response:**
```json
{
  "session_id": "uuid",
  "final_report": "# SiliconForge AI Research Report\n...",
  "agent_trace": [
    { "node": "planner", "timestamp": "2024-01-01T00:00:00Z", "summary": "..." }
  ],
  "iteration_count": 1
}
```

---

### `GET /api/v1/research/stream/{session_id}?query=...`
Stream agent progress as Server-Sent Events. **This is the primary endpoint used by the UI.**

**SSE event format (per node):**
```json
{ "event": "node_complete", "node": "planner", "summary": "...", "timestamp": "..." }
```

**Final SSE event:**
```json
{ "event": "complete", "session_id": "...", "final_report": "..." }
```

**Error event:**
```json
{ "event": "error", "message": "..." }
```

---

### `GET /api/v1/research/history`
Returns the 20 most recent completed research sessions.

**Response:**
```json
[{ "session_id": "...", "user_query": "...", "created_at": "...", "status": "complete" }]
```

---

### `GET /api/v1/health`
Returns connectivity status for all backend services.

**Response:**
```json
{ "status": "ok", "ollama": true, "chromadb": true, "postgres": true }
```

Interactive API docs available at **http://localhost:8000/docs** (Swagger UI).

---

## 🔌 MCP Servers

Two [Model Context Protocol](https://modelcontextprotocol.io) servers are included. They communicate over stdio and can be used by external MCP clients (Claude Desktop, LangChain, etc.).

### Literature Server (ChromaDB)
```bash
uv run python -m backend.mcp_servers.literature_server
```
Exposes tool: `query_semiconductor_literature(query: str, limit: int = 3)`

### Search Server (ArXiv)
```bash
uv run python -m backend.mcp_servers.search_server
```
Exposes tool: `search_arxiv_papers(query: str, max_results: int = 5)`

> **Note:** The LangGraph agent calls the tool functions directly (not via MCP transport) for performance. The MCP servers are provided for integration with external MCP-compatible clients and toolchains.

---

## 🧩 Adding New Semiconductor Domains

1. **Add entries to `data/sample_papers.json`:**
```json
{
  "id": "chunk_012",
  "title": "Your Paper Title",
  "abstract": "Full abstract text used for semantic search...",
  "domain": "euv_lithography",
  "year": 2024,
  "keywords": ["EUV", "stochastic defects", "resist"]
}
```

2. **Delete the ChromaDB store** to force re-seeding:
```bash
# Windows
rmdir /s /q chroma_store

# macOS / Linux
rm -rf ./chroma_store
```

3. **Restart the API server** — `init_literature_store()` detects an empty collection and re-seeds automatically.

4. **Update physical constraints** in `backend/agents/nodes.py` inside `critique_node` if your domain has different process windows.

---

## 🔭 Future Scope

### Near-Term (v0.2)
- [ ] **Full report persistence** — Store generated reports in PostgreSQL so history sessions show the actual report without re-running
- [ ] **PDF export** — Export reports as formatted PDF using WeasyPrint or Puppeteer
- [ ] **Query pre-fill from history** — Clicking a history session pre-fills the query input for easy re-runs
- [ ] **Configurable constraint profiles** — Let users select from domain-specific constraint sets (DRAM, NAND, Logic, Analog)

### Medium-Term (v0.3)
- [ ] **Citation linking** — Make reference numbers in reports hyperlinked to ArXiv DOIs
- [ ] **Multi-model support** — A/B test different Ollama models per node (e.g., use a larger model for synthesis only)
- [ ] **User authentication** — JWT-based auth so multiple researchers can have private session histories
- [ ] **Custom paper upload** — Allow uploading proprietary PDFs to extend the ChromaDB vector store
- [ ] **Feedback loop** — Thumbs up/down on reports to fine-tune critique constraints over time

### Long-Term (v1.0)
- [ ] **Graph memory** — Persistent cross-session knowledge graph of validated findings
- [ ] **Experiment tracking** — Integration with lab notebook systems (ELN) for closing the research loop
- [ ] **Multi-agent parallelism** — Run retrieval and critique agents in parallel across multiple sub-queries
- [ ] **Patent search integration** — Add Google Patents / USPTO as a retrieval source
- [ ] **Spectre / SPICE integration** — Generate simulation scripts from experiment plans
- [ ] **Slack / Teams integration** — Trigger research runs and receive reports via chat

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Jayant Som

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
```

---

## 👤 Author

<div align="center">

**Jayant Som**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Jayant_Som-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/jayantsom)

*Building at the intersection of AI and deep tech.*

</div>

---

<div align="center">

**If you found this useful, please ⭐ star the repository.**

Made with ⚗️ and a lot of semiconductor physics.

</div>
