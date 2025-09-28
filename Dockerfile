# syntax=docker/dockerfile:1.7
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development \
    HUSKY=0 \
    CI=true

# solo package* para cachear instalación
COPY package.json package-lock.json ./

# instala deps de dev sin correr scripts (evita prepare/husky)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --ignore-scripts

# no copiamos el código aquí; lo montamos por volumen en compose
EXPOSE 3000
CMD ["npm", "run", "dev"]  # tu package.json ya tiene "dev": "nodemon src/server.js"
