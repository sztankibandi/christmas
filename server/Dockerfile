FROM node:20-alpine

# Use project root as build context in docker-compose so we can COPY src
WORKDIR /app

# Copy only server package.json first for faster npm install
COPY server/package.json server/package-lock.json* ./
RUN npm install --production --no-audit --no-fund

# Copy server code
COPY server/ ./

# Copy app assets (pdfs, memes) from project src into image
COPY src/ ./src/

EXPOSE 3000
CMD ["node", "index.js"]
