# ============================================
# fzsmphone - Multi-stage Production Build
# ============================================

# ---- Stage 1: Build Frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Cache node_modules
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build frontend (VITE_* vars must be available at build time)
ARG VITE_DISCORD_CLIENT_ID
ENV VITE_DISCORD_CLIENT_ID=${VITE_DISCORD_CLIENT_ID}

COPY index.html tsconfig.json tsconfig.node.json vite.config.ts env.d.ts ./
COPY src/ ./src/
RUN npm run build

# ---- Stage 2: Build Backend ----
FROM golang:1.22-alpine AS backend-builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Cache Go modules
COPY server/go.mod server/go.sum ./
RUN go mod download

# Build binary
COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/server ./cmd/api

# ---- Stage 3: Runtime ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/server ./server

# Copy frontend dist
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8080

CMD ["./server"]
