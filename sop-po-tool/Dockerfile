FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:alpine
# Copy built static files to Nginx web root
COPY --from=build /app/build /usr/share/nginx/html

# Fix React Router 404s on page refresh
RUN sed -i 's/try_files $uri $uri\//try_files $uri $uri\/ \/index.html/' /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
