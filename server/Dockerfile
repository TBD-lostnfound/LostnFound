# Agent server container. Build from the repo root:
#   docker build -f server/Dockerfile .
# The server reads docs/ and prompts/ at startup, so those are copied too.
FROM node:24-slim
WORKDIR /app/server

# Install packages first, so Docker can reuse this layer when only the code changes.
COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/ ./
COPY docs/ /app/docs/
COPY prompts/ /app/prompts/

# Cloud Run sends traffic to port 8080 by default.
ENV SERVER_PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]
