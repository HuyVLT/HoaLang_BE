FROM node:20-alpine AS builder

WORKDIR /app

# Enable PNPM package manager
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

# Install development packages
RUN pnpm install

COPY . .

# Compile TS code to JavaScript
RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

# Install production-only packages
RUN pnpm install --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/app.js"]
