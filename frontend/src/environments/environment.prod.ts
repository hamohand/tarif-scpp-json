// Ce fichier est pour l'environnement de production.

export const environment = {
  production: true,
  // URL de l'API en production.
  // Le chemin est relatif car le frontend et le backend sont servis sous le même domaine.
  // NGINX se chargera de rediriger les requêtes commençant par /api vers le backend.
  apiUrl: '/api'
};
