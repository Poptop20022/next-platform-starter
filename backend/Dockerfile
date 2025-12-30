FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY .env.example .env

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Build
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

