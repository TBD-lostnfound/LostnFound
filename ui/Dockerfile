# Website container. Build from the repo root:
#   docker build -f ui/Dockerfile .

# Stage 1: build the React site into plain HTML/CSS/JS files (ui/dist).
FROM node:24-slim AS build
WORKDIR /app/ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Stage 2: serve those files with nginx. Node is not needed at runtime, so the final image is small.
FROM nginx:alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/ui/dist /usr/share/nginx/html
EXPOSE 8080
