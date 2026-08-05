# Front Next.js de la plateforme Wapy (contexte de build = web/)
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
# API servie sur le même domaine via Caddy -> chemins relatifs
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]
