# Use Node 20.11.1 as specified in your environment
FROM node:20.11.1-alpine as frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Backend build stage
FROM node:20.11.1-alpine as backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY backend/ ./

# Final stage
FROM node:20.11.1-alpine

# Set working directory
WORKDIR /app

# Copy backend from backend-build
COPY --from=backend-build /app/backend ./backend

# Copy frontend build from frontend-build
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Set working directory to backend
WORKDIR /app/backend

# Expose backend port
EXPOSE 3001

# Start the backend server using nodemon for development
CMD ["npx", "nodemon", "index.js"]