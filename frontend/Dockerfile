FROM node:20-alpine

WORKDIR /app

COPY package.json ./

# RUN npm install is bypassed in compose volume mounts, but kept for standalone image builds
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

# Run Vite server
CMD ["npm", "run", "dev"]
