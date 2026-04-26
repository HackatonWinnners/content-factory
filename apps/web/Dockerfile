# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# ---- build ----
FROM base AS build
ARG NEXT_PUBLIC_SERVER_URL=https://api.hack.042067.xyz
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -F web build

# ---- runtime ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
# Lockfile + manifests for SCA scanners (Aikido). Standalone build doesn't
# need them at runtime; keeping them so vulnerability scanners read the graph.
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
