FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Install development packages
RUN npm install --legacy-peer-deps

COPY . .

# Compile TS code to JavaScript
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json* ./

# Install production-only packages
RUN npm install --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/app.js"]
