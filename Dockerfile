FROM oven/bun:latest

WORKDIR /app

# Abhängigkeiten installieren (wird gecached!)
COPY package.json bun.lockb* ./
RUN bun install

# Restlichen Code kopieren
COPY . .
