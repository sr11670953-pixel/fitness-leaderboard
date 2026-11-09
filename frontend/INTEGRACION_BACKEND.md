# Contrato de integración para el backend

El frontend está preparado para consumir estos endpoints. **No se modificó backend/**.

## Variables (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000/ws/leaderboard
VITE_USE_MOCK_LEADERBOARD=true
VITE_USE_MOCK_CHALLENGES=true
```

Cuando el backend implemente los endpoints, cambiar los dos `VITE_USE_MOCK_*` a `false` y reiniciar Vite. En producción usar URL HTTPS y WSS reales.

## Endpoints nuevos que debe implementar el backend

- `GET /leaderboard`: `{ "entries": [{ "position": 1, "userId": "id", "username": "ana", "points": 320 }] }` (también acepta arreglo directo).
- `WS /ws/leaderboard`: mensajes `{ "type": "leaderboard", "entries": [...] }`; el cliente reconecta con backoff de 1, 2, 4... hasta 30 segundos.
- `GET /challenges`: arreglo de `{ id, name, startsAt, endsAt }`.
- `POST /challenges`: cuerpo `{ name, startsAt, endsAt }`.
- `POST /challenges/:id/join`: une al usuario autenticado.
- `GET /challenges/:id/leaderboard`: `{ entries: [...] }` o arreglo directo.

## Autenticación y actividades

El frontend utiliza `GET /auth/me`, `POST /auth/logout`, `POST /auth/refresh`, `GET /activities`, `POST /activities`. El token de acceso vive en Pinia; el refresh usa cookie HTTP-only enviada con `withCredentials`. El servidor debe permitir credenciales CORS desde el origen del frontend. Para producción HTTPS con frontend y backend en dominios diferentes, configurar correctamente `SameSite=None; Secure` en la cookie de refresh.

## Comprobaciones antes de entregar

Desde `frontend/` ejecutar `npm install`, `npm run type-check`, `npm test`, `npm run build` y `npm run dev`. El equipo debe verificar las pruebas y la compilación en su entorno: este ZIP no incluye resultados certificados de ejecución. Si Windows bloquea un binario de Rollup, resolver la política de seguridad con el administrador del equipo; no desactivar protecciones.

## Pendiente externo

El despliegue público requiere URL pública del backend, credenciales de Vercel/Netlify y permisos del repositorio. El PR requiere crear una rama y subir commits con acceso al repositorio remoto.
