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
- `src/api/leaderboardSocket.ts`: cliente WebSocket del ranking (reconexión con espera creciente), validador del mensaje y simulador. Dirección por defecto: `ws://localhost:3000/ws/leaderboard` (se cambia con `VITE_WS_URL`).
- `src/stores/leaderboard.ts`: estado del ranking. Si no hay servidor, usa el simulador y avisa en pantalla.
- `src/stores/challenges.ts` y `src/utils/challenges.ts`: retos con datos de mentira, unirse y estado (en curso, próximo, finalizado).
- `src/views/`: Login, Registro, Actividades, Ranking, Retos, Detalle de reto y Mi cuenta.
- `src/data/`: datos de mentira del ranking (misma forma que el contrato real) y de los retos.

## Pendiente cuando el backend lo tenga

- Ranking: cuando exista `ws://localhost:3000/ws/leaderboard` con el mensaje `{ type: 'leaderboard', entries: [{ position, userId, username, points }] }`, el simulador se apaga solo; no hay que tocar la pantalla.
- Retos: reemplazar los datos falsos de `stores/challenges.ts` por `GET /challenges` y `POST /challenges/:id/join` (los bloques están comentados en el código).
- `GET /auth/me` devuelve solo `id` y `role`, así que tras recargar la página el nombre de usuario no se puede mostrar. Si el backend devolviera también `username` y `email`, el encabezado y Mi cuenta lo mostrarían solos.
