# syntax=docker/dockerfile:1.7
FROM node:22-bookworm AS base

# Chromium + ffmpeg + fonts so Remotion can render at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
		ffmpeg \
		chromium \
		fonts-liberation fonts-dejavu fonts-noto fonts-noto-color-emoji \
		libnss3 libatk-bridge2.0-0 libatk1.0-0 libdrm2 libxkbcommon0 \
		libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
		libpango-1.0-0 libcairo2 libcups2 \
	&& rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /repo
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm -F server build

# Runtime writes per-job audio here; ensure dirs exist.
RUN mkdir -p packages/composer/public/jobs packages/composer/public/music

ENV NODE_ENV=production
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
EXPOSE 3000

WORKDIR /repo/apps/server
CMD ["node", "dist/index.mjs"]
