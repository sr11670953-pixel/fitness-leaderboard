# Plataforma de Fitness Gamificado con Leaderboards en Tiempo Real

Proyecto de grado (parejas). Los usuarios registran actividades físicas, ganan puntos y compiten en un ranking en vivo.

## Estructura

- backend/: API en Node.js + TypeScript + Express + PostgreSQL
- frontend/: Vue 3 + Pinia + TypeScript (en desarrollo)

## Ejecutar el backend

1. Crear una base de datos vacía llamada fitness_leaderboard en PostgreSQL.
2. cd backend
3. npm install
4. cp .env.example .env  (y editar con tu clave y un JWT_SECRET propio)
5. npm run migrate
6. npm run dev

Probar en http://localhost:3000/health

## Rutas

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- GET /activities/types
- POST /activities
- GET /activities
- GET /activities/:id
- DELETE /activities/:id

Las rutas de /activities requieren la cabecera Authorization: Bearer <accessToken>.
El accessToken se guarda en memoria; el refresh token viaja en cookie HttpOnly (usar withCredentials: true).
