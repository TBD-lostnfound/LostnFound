# Photo reader container. Build from the repo root:
#   docker build -f image-recognition/Dockerfile .
FROM node:24-slim
WORKDIR /app/image-recognition

# Install packages first, so Docker can reuse this layer when only the code changes.
COPY image-recognition/package.json image-recognition/package-lock.json ./
RUN npm ci

COPY image-recognition/ ./

# Cloud Run sends traffic to port 8080 by default.
ENV IMAGE_RECOGNITION_PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]
