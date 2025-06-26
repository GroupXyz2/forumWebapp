# Use official Node.js LTS image
FROM node:24-alpine3.21

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app (excluding .env.local and certificates)
COPY . .

# Copy special Docker config file and build env
COPY next.config.docker.js next.config.docker.js
COPY .env.build .env.build

# Set environment variables to bypass type checking and telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_IGNORE_TYPE_ERRORS=1
ENV NODE_ENV=production
ENV NEXT_IGNORE_ESLINT=1
ENV NEXT_CONFIG_FILE=next.config.docker.js

# Use environment variables during build and special Next.js config
RUN cp next.config.docker.js next.config.js && \
    npm run build:docker && \
    echo "Build completed successfully"

# Expose the port (match your .env.local PORT)
EXPOSE 3456

# Start the app using the custom server
CMD ["npm", "run", "start:ssl"]