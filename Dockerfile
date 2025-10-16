# Build stage.
FROM node:22-alpine AS build

# Set working directory.
WORKDIR /app

# Copy package files.
COPY package*.json ./

# Install dependencies.
RUN npm ci

# Copy application source.
COPY . .

# Build the application.
RUN npm run build

# Production stage.
FROM nginx:alpine

# Copy built assets from build stage.
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA routing support.
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80.
EXPOSE 80

# Start nginx.
CMD ["nginx", "-g", "daemon off;"]