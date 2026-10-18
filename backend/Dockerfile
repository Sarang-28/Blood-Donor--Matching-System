FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --workspace backend --ignore-scripts
COPY backend ./backend
COPY shared ./shared
USER node
WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
