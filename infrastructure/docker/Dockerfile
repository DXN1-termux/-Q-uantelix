# [Q]uantelix — Production Docker Image
FROM node:22-alpine AS web-builder
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

FROM python:3.12-slim AS runner
WORKDIR /app

# Install Node.js for agent engine
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything
COPY --from=web-builder /app/.next ./.next
COPY --from=web-builder /app/public ./public
COPY --from=web-builder /app/package*.json ./
COPY server/ ./server/
COPY agent/ ./agent/
COPY assets/ ./assets/

EXPOSE 3000

CMD ["python3", "server/app.py"]
