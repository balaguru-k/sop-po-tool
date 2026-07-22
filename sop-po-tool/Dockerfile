# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install 

# Copy app source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Optional: add nginx config if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
