# Stage 1: Build the React application
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
