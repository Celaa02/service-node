FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=development HUSKY=0 CI=true

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --ignore-scripts

COPY . .
EXPOSE 3000
CMD ["npm","run","dev"]
