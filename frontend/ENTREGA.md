# Entrega frontend

## Ejecutar
Node.js >=22.22.2 recomendado. `npm install`, `npm run dev`, `npm run type-check`, `npm test`, `npm run build`.

## Variables (.env)
`VITE_API_URL=http://localhost:3000`
`VITE_WS_URL=ws://localhost:3000/ws/leaderboard`
`VITE_USE_MOCK_LEADERBOARD=true`
`VITE_USE_MOCK_CHALLENGES=true`

Cambiar las dos variables MOCK a `false` cuando estén listos los endpoints. En producción usar HTTPS/WSS y definir VITE_API_URL en Vercel o Netlify. Configurar CORS y cookies del backend.

## Git
`git pull` antes de empezar; crear rama con `git switch -c feat/frontend-completo`; hacer commits por funcionalidad y abrir PR contra main desde GitHub. El ZIP no incluye historial .git.

## Pendientes externos
Desplegar cuando el backend esté disponible en nube; validar los contratos de retos (aún provisionales), ranking inicial y WS con el backend real.
