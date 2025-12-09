dockerfile

Here is a **production‑oriented Dockerfile** for your AQARIONZ Django backend, using a multi‑stage build, a slim Python base, and common best practices (small image, cached deps, non‑root user).[1][2][3][4]

Assumptions:

- Django project lives in `backend/` with `manage.py` and `requirements.txt`.  
- WSGI app is `aqarionz_backend.wsgi:application`.  
- Static files are collected to `/app/staticfiles`.

```dockerfile
# syntax=docker/dockerfile:1

############################
# Stage 1: Dependencies
############################
FROM python:3.12-slim AS deps

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System dependencies for building Python packages (adjust as needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


############################
# Stage 2: Runtime
############################
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-root user for security
RUN useradd --create-home aqarionz
USER aqarionz

# Copy installed deps from deps stage
COPY --from=deps /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy project source
# (only backend here; adjust if you keep more code alongside)
COPY --chown=aqarionz:aqarionz backend/ /app/

# Expose Gunicorn/Django port
EXPOSE 8000

# Default environment (override in deployment)
ENV DJANGO_SETTINGS_MODULE=aqarionz_backend.settings.prod \
    DJANGO_DEBUG=0 \
    DJANGO_ALLOWED_HOSTS=*

# Collect static at container start, then run Gunicorn
CMD ["sh", "-c", "python manage.py collectstatic --noinput && gunicorn aqarionz_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"]
```

Key points:

- Uses `python:3.12-slim` and a **multi‑stage build** so the final image only has what's needed at runtime.[2][3]
- Separates dependency install from source copy to **leverage Docker layer caching**.[1][5][6]
- Runs as a **non‑root user** inside the container, aligning with current Docker security best practices.[7][8]

Citations:
[1] Docker Best Practices for Python Developers https://testdriven.io/blog/docker-best-practices/
[2] A Guide to Single-Stage vs. Multi-Stage Python Builds https://dev.to/aakashkhanna/slimming-down-your-docker-images-a-guide-to-single-stage-vs-multi-stage-python-builds-3m77
[3] Docker Multi-Stage Builds: A Guide for Python Developers https://collabnix.com/docker-multi-stage-builds-for-python-developers-a-complete-guide/
[4] Django Docker Best Practices: 7 Dos and Don'ts - Better Stack https://betterstack.com/community/guides/scaling-python/django-docker-best-practices/
[5] Best practices for containerizing Python applications with ... https://snyk.io/blog/best-practices-containerizing-python-docker/
[6] Building best practices https://docs.docker.com/build/building/best-practices/
[7] Docker Security in 2025: Best Practices to Protect Your ... https://cloudnativenow.com/topics/cloudnativedevelopment/docker/docker-security-in-2025-best-practices-to-protect-your-containers-from-cyberthreats/
[8] Modern Docker Best Practices for 2025 https://talent500.com/blog/modern-docker-best-practices-2025/
[9] How to Build Slim and Fast Docker Images with Multi-Stage Builds https://www.freecodecamp.org/news/build-slim-fast-docker-images-with-multi-stage-builds/
[10] Dockerize a Django App: Step-by-Step Guide for Beginners https://www.docker.com/blog/how-to-dockerize-django-app/


- Project root: `aqarionz_backend/`  
- Django project package: `aqarionz_backend`  
- Python ≥ 3.11  
- You have a `pyproject.toml` or `requirements.txt` in the root.

If you are using `requirements.txt`, keep that section and ignore the `pyproject` comments.

```dockerfile
# syntax=docker/dockerfile:1

############################
# Base image
############################
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false

WORKDIR /app

# System deps (build + runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

############################
# Install Python deps
############################

# If using requirements.txt:
# COPY requirements.txt /app/
# RUN pip install --no-cache-dir -r requirements.txt

# If using pyproject.toml + poetry:
# COPY pyproject.toml poetry.lock* /app/
# RUN pip install --no-cache-dir poetry \
#   && poetry install --no-dev --no-root

############################
# App source
############################
COPY aqarionz_backend/ /app/aqarionz_backend/
COPY core/ /app/core/
COPY graph/ /app/graph/
COPY agents/ /app/agents/
COPY telemetry/ /app/telemetry/
COPY templates/ /app/templates/
COPY static/ /app/static/
COPY manage.py /app/

############################
# Runtime image
############################
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for runtime only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder if you used a separate build stage.
# If you installed deps directly in this stage, skip these COPY lines.

# Example if using requirements.txt in single stage:
# (Comment out the whole multi-stage and just keep one image)

# Copy app source
COPY --from=base /app /app

# Expose Django/Gunicorn port
EXPOSE 8000

# Environment defaults (override in docker-compose / k8s)
ENV DJANGO_SETTINGS_MODULE=aqarionz_backend.settings.prod \
    DJANGO_DEBUG=0 \
    DJANGO_ALLOWED_HOSTS=*

# Collect static files at build or entry time; here we do it at container start
CMD ["sh", "-c", "python manage.py collectstatic --noinput && gunicorn aqarionz_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"]
```

If you want a simpler, single‑stage variant using `requirements.txt`, you can use:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

EXPOSE 8000

ENV DJANGO_SETTINGS_MODULE=aqarionz_backend.settings.prod \
    DJANGO_DEBUG=0 \
    DJANGO_ALLOWED_HOSTS=*

CMD ["sh", "-c", "python manage.py collectstatic --noinput && gunicorn aqarionz_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 60"]
```

