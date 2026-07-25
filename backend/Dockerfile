# ═══════════════════════════════════════════════════════════════════════
# Agrikarta Backend — Node.js 20 Alpine Dockerfile
# ═══════════════════════════════════════════════════════════════════════
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Ensure auth_info_baileys directory exists for volume mount
RUN mkdir -p /app/bot/auth_info_baileys

EXPOSE 5000

CMD ["node", "server.js"]
