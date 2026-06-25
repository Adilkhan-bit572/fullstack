FROM python:3.14-slim-trixie
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY . /app

EXPOSE 8000

WORKDIR /app
RUN uv sync --locked

CMD ["uv", "run", "main.py"]

