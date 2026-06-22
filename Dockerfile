FROM oven/bun:1.3.14-alpine AS build

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN timeout -s TERM 600s bun run build; \
    code="$?"; \
    if [ "$code" = "0" ]; then exit 0; fi; \
    if { [ "$code" = "124" ] || [ "$code" = "143" ]; } && [ -f ".output/server/index.mjs" ]; then \
    echo "Nuxt build finished, but bun process did not exit. Continuing."; \
    exit 0; \
    fi; \
    exit "$code"


FROM node:22-alpine AS runner

WORKDIR /app

ARG TYPST_VERSION=0.14.0

RUN apk add --no-cache ca-certificates curl tar xz \
    && ARCH="$(uname -m)" \
    && if [ "$ARCH" = "x86_64" ]; then TYPST_ARCH="x86_64-unknown-linux-musl"; \
    elif [ "$ARCH" = "aarch64" ]; then TYPST_ARCH="aarch64-unknown-linux-musl"; \
    else echo "Unsupported arch: $ARCH" && exit 1; fi \
    && curl -L -o /tmp/typst.tar.xz "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${TYPST_ARCH}.tar.xz" \
    && mkdir -p /tmp/typst \
    && tar -xf /tmp/typst.tar.xz -C /tmp/typst --strip-components=1 \
    && mv /tmp/typst/typst /usr/local/bin/typst \
    && chmod +x /usr/local/bin/typst \
    && typst --version \
    && rm -rf /tmp/typst /tmp/typst.tar.xz

COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/server/templates ./server/templates
COPY --from=build /app/certs ./certs

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_PATH=/app/node_modules
ENV TYPST_BIN=/usr/local/bin/typst
ENV GIGACHAT_CA_BUNDLE_FILE=/app/certs/russian_trusted_root_ca_pem.crt

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]