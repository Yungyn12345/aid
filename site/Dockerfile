FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY landing_app ./landing_app
COPY templates ./templates
COPY static ./static
COPY wsgi.py ./wsgi.py

EXPOSE 3000

CMD ["gunicorn", "--bind", "0.0.0.0:3000", "wsgi:app"]
