FROM node:26-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./

FROM base AS build
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
