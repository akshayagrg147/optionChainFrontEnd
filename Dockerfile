# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Accept build arguments for React environment variables
ARG REACT_APP_BASE_URL=http://127.0.0.1:8000/
ARG REACT_APP_WEB_SOCKET_URL=ws://localhost:8000/ws/option-data/
ARG REACT_APP_MANUAL_WEB_SOCKET_URL=ws://localhost:8000/ws/manualtrade/
ARG REACT_APP_ZERODHA_WEB_SOCKET_URL=ws://localhost:8000/ws/zerodha/
ARG REACT_APP_ZERODHA_MANUAL_WS_URL

# Set environment variables for build
ENV REACT_APP_BASE_URL=${REACT_APP_BASE_URL}
ENV REACT_APP_WEB_SOCKET_URL=${REACT_APP_WEB_SOCKET_URL}
ENV REACT_APP_MANUAL_WEB_SOCKET_URL=${REACT_APP_MANUAL_WEB_SOCKET_URL}
ENV REACT_APP_ZERODHA_WEB_SOCKET_URL=${REACT_APP_ZERODHA_WEB_SOCKET_URL}
ENV REACT_APP_ZERODHA_MANUAL_WS_URL=${REACT_APP_ZERODHA_MANUAL_WS_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application (environment variables are baked in at this step)
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
