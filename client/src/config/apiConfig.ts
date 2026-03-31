/**
 * Détermine automatiquement l'URL de l'API en fonction de l'environnement
 * - Dev: localhost:3000
 * - Production Render: détecte intelligemment l'URL du backend
 * - Fallback: tente d'utiliser la même origine (pour reverse proxy/proxy)
 */
export function getApiUrl(): string {
  // 1. Configuration explicite (priorité la plus haute)
  const configured = import.meta.env.VITE_API_URL;
  if (configured && configured.trim()) {
    console.log('✅ VITE_API_URL configurée:', configured);
    return configured;
  }

  // 2. Mode développement
  if (import.meta.env.DEV) {
    console.log('✅ Mode DEV: utilise localhost:3000');
    return 'http://localhost:3000';
  }

  // 3. Production: détecte l'URL du backend
  const origin = window.location.origin;
  
  // Si on est sur Render et que le backend est sur même domaine (via reverse proxy)
  console.log('ℹ️ Production: tentative same-origin:', origin);
  
  // 4. Fallback: utilise l'origine courante
  return origin;
}

/**
 * Même logique pour WebSocket
 */
export function getWsUrl(): string {
  // 1. Configuration explicite WebSocket
  const configuredWs = import.meta.env.VITE_WS_URL;
  if (configuredWs && configuredWs.trim()) {
    console.log('✅ VITE_WS_URL configurée:', configuredWs);
    return configuredWs;
  }

  // 2. Utilise l'URL API configurée
  const apiUrl = getApiUrl();
  
  // 3. Convertit http/https en ws/wss
  if (apiUrl.startsWith('https://')) {
    const wsUrl = apiUrl.replace('https://', 'wss://');
    console.log('✅ WebSocket URL (secure):', wsUrl);
    return wsUrl;
  }
  if (apiUrl.startsWith('http://')) {
    const wsUrl = apiUrl.replace('http://', 'ws://');
    console.log('✅ WebSocket URL:', wsUrl);
    return wsUrl;
  }

  console.warn('⚠️ WebSocket URL: fallback à apiUrl');
  return apiUrl;
}

/**
 * Crée les headers par défaut pour les requêtes API
 */
export function getDefaultHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
