FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy scripts
COPY . .

CMD ["node", "init-dynamodb.js"]