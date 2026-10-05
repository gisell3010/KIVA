FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .

RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

RUN groupadd --gid 10001 kiva \
    && useradd --uid 10001 --gid kiva --no-create-home kiva \
    && mkdir -p /app/uploads/profiles /app/uploads/destinations \
    && chown -R kiva:kiva /app/uploads

USER kiva

EXPOSE 8000

CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-access-log"]
