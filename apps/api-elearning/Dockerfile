FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api-elearning/package*.json ./apps/api-elearning/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared-types/package*.json ./packages/shared-types/
RUN npm ci --workspace=apps/api-elearning --workspace=packages/database --workspace=packages/shared-types
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/shared-types ./packages/shared-types
COPY apps/api-elearning ./apps/api-elearning
RUN npm run db:generate
RUN npm run build --workspace=apps/api-elearning

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-elearning/dist ./dist
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
