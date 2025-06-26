# Use Ubuntu as base to include both Node.js and MongoDB
FROM ubuntu:22.04

# Avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js, MongoDB and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    lsb-release \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y nodejs mongodb-org \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create MongoDB data directory
RUN mkdir -p /data/db

# Set working directory for the app
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the app
COPY . .

# Create local environment file
RUN echo "MONGODB_URI=mongodb://localhost:27017/forum" > .env.local && \
    echo "MONGODB_DB=forum" >> .env.local && \
    echo "USE_SSL=false" >> .env.local && \
    echo "PORT=3456" >> .env.local && \
    echo "HOST=0.0.0.0" >> .env.local

# Expose the port
EXPOSE 3456

# Create startup script
RUN echo "#!/bin/bash\n\
echo 'Starting MongoDB...'\n\
mongod --fork --logpath /var/log/mongodb.log --bind_ip 0.0.0.0\n\
sleep 2\n\
echo 'MongoDB started successfully'\n\
echo 'Starting Next.js application...'\n\
npm run dev:ssl" > /app/start.sh \
&& chmod +x /app/start.sh

# Start MongoDB and the app
CMD ["/app/start.sh"]