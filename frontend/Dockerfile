# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build


# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Utiliser l'image officielle de NGINX comme base
#FROM nginx:latest

# Copier les fichiers statiques du projet (HTML, CSS, JS)
COPY --from=build /app/dist/frontend/ /var/www/html

# Copier le fichier de configuration `development.conf` dans le dossier dédié
#COPY development.conf /etc/nginx/sites-available/development.conf

# Configure Nginx for Angular routing
COPY nginx-dev.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
