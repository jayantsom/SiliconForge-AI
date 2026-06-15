.PHONY: install dev ollama-pull lint test

install:
	uv sync

dev:
	uv run uvicorn backend.main:app --reload --port 8000

ollama-pull:
	ollama pull llama3.1:8b

lint:
	uv run ruff check backend/

test:
	uv run pytest tests/ -v
