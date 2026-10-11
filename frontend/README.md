# Frontend: Fitness Leaderboard

Vue 3 + Pinia + Vue Router + TypeScript estricto (sin `any`) + Axios.

## Ejecutar

1. Levanta el backend (ver README de la raíz) en `http://localhost:3000`.
2. `cd frontend`
3. `npm install`
4. `npm run dev` y abre `http://localhost:5173`

Opcional: copia `.env.example` a `.env` si el backend corre en otra URL (`VITE_API_URL`).

Comprobar tipos y compilar: `npm run build`.

## Estructura

- `src/api/client.ts`: instancia única de Axios (`baseURL`, `withCredentials: true`), interceptor que renueva el token ante un 401 y reintenta, y `parseApiError`.
- `src/types/`: `User`, `Activity`, `ActivityType` y tipos de las respuestas.
- `src/stores/auth.ts`: sesión. El `accessToken` vive solo en memoria. `restoreSession()` lo recupera al recargar usando la cookie del refresh token.
- `src/stores/activities.ts`: actividades con estado normalizado (`byId` + `ids`), estados de carga y error.
- `src/router/index.ts`: rutas y Navigation Guard.
- `src/views/`: Login, Registro, Actividades y Ranking.
- `src/data/mockLeaderboard.ts`: datos de mentira del ranking.

## Pendiente cuando el backend lo tenga

- Reemplazar `mockLeaderboard` por la llamada real al ranking y conectar WebSockets.
- `GET /auth/me` devuelve solo `id` y `role`, así que tras recargar la página el nombre de usuario no se puede mostrar. Si el backend devolviera también `username` y `email`, el encabezado lo mostraría solo.
