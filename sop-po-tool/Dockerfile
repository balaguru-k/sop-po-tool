# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies using clean install & legacy peer deps to avoid conflicts
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || RUN npm install --legacy-peer-deps

# Copy app source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
