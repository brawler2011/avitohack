FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .

RUN bun run build

FROM alpine:3.19

COPY --from=builder /app/dist /app/dist

CMD ["sh", "-c", "rm -rf /frontend_assets/* && cp -r /app/dist/* /frontend_assets/"]


