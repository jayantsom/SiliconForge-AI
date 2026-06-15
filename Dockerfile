FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv --no-cache-dir

# Copy dependency manifest first for layer caching
COPY pyproject.toml .

# Install production dependencies only
RUN uv sync --no-dev

# Copy application code
COPY backend/ ./backend/
COPY data/ ./data/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
