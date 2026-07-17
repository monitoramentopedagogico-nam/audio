FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV JAVA_TOOL_OPTIONS=-Xmx2500m

ARG AUDIVERIS_VERSION=5.10.2

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    ghostscript \
    libpq-dev \
    python3-dev \
    tesseract-ocr \
    && curl -fsSL "https://api.github.com/repos/Audiveris/audiveris/releases/tags/${AUDIVERIS_VERSION}" -o /tmp/audiveris-release.json \
    && AUDIVERIS_URL="$(grep -o 'https://[^\"]*ubuntu22\.04[^\"]*\.deb' /tmp/audiveris-release.json | head -n 1)" \
    && test -n "$AUDIVERIS_URL" \
    && curl -fsSL "$AUDIVERIS_URL" -o /tmp/audiveris.deb \
    && apt-get install -y --no-install-recommends /tmp/audiveris.deb \
    && AUDIVERIS_BIN="$(find /opt /usr -type f -iname 'audiveris' -perm /111 2>/dev/null | head -n 1)" \
    && test -n "$AUDIVERIS_BIN" \
    && ln -sf "$AUDIVERIS_BIN" /usr/local/bin/audiveris \
    && rm -f /tmp/audiveris.deb /tmp/audiveris-release.json \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080
CMD ["sh", "-c", "cd mysite && python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn mysite.wsgi:application --bind 0.0.0.0:8080 --workers 2 --timeout 240"]
