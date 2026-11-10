CONTEXTO: Proyecto de grado de ingeniería de software, tema #19 "Plataforma de Fitness Gamificado con Leaderboards en Tiempo Real" (nivel parejas). Yo hago el BACKEND y mi compañero el FRONTEND. Trabajo en Windows con Git Bash y VS Code, y sé poco de Git y terminal. Necesito avanzar UN SOLO PASO A LA VEZ, explicando qué hace cada cosa antes de ejecutarla, con respuestas cortas cuando la pregunta es puntual.

REPO: https://github.com/sr11670953-pixel/fitness-leaderboard (privado, un solo repo, rama main)
  backend/   -> Node + TypeScript estricto (sin any) + Express + PostgreSQL local
  frontend/  -> Vue 3 + Pinia + TypeScript (lo hace mi compañero, ya está unido en main)
Los comandos del backend se ejecutan dentro de backend/ (npm run dev, npm run migrate, npx tsc --noEmit). Los de Git, desde la carpeta de afuera (~/fitness-leaderboard-backend).

ESTÁNDAR DE LA GUÍA/RÚBRICA: Clean Architecture por capas con inversión de dependencias, TypeScript sin any, doble token (access en memoria, refresh rotativo en cookie HttpOnly), validación de dueño del recurso, transacciones ACID, migraciones versionadas, logs con x-correlation-id, rate limiting, pruebas unitarias e integración, despliegue en la nube, historial de Git ordenado.

BACKEND HECHO Y PROBADO
- Base de datos: migración 001_init.sql con 8 tablas (users, refresh_tokens, activity_types, activity_logs, point_events, challenges, challenge_participants, schema_migrations) y 5 tipos de actividad precargados (Correr, Ciclismo, Natación, Pesas, Caminata). Ejecutor propio migrate.ts con transacciones (npm run migrate).
- Capas en backend/src: domain, application, infrastructure, presentation, config. Repositorios detrás de interfaces.
- env.ts valida con Zod: DATABASE_URL, JWT_SECRET (mínimo 32), PORT, CORS_ORIGIN.
- Servidor Express con /health, manejador global de errores y CORS con credenciales (origen http://localhost:5173).
- Autenticación completa: register (Argon2id), login (JWT de 15 min + refresh token aleatorio de 7 días guardado solo como hash SHA-256 con family_id), refresh con rotación y detección de reuso (revoca toda la familia), logout, middleware authenticate (JWT) y requireRole (existe pero ninguna ruta lo usa todavía).
- Rutas: GET /health, POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me, GET /activities/types, POST /activities, GET /activities, GET /activities/:id, DELETE /activities/:id (todas las de /activities y /auth/me exigen Authorization: Bearer).
- CRUD de actividades con validación de dueño (todas las consultas filtran por user_id, el userId sale del token). Puntos = duración x puntos_por_minuto + distancia x puntos_por_km, redondeado.
- Cola de trabajos: contrato JobQueue<T> y PointsJob en domain/job-queue.ts; InMemoryJobQueue con reintentos exponenciales (500ms, 1s, 2s..., máximo 5 intentos) en infrastructure/queue; PointsWorker idempotente (INSERT ... ON CONFLICT DO NOTHING sobre point_events.activity_log_id UNIQUE) en application/points-worker.ts.
- Documentos entregados: README.md en la raíz, backend/.env.example, y un Word con las tareas del frontend.

ÚLTIMO TRABAJO EN CURSO: conectar la cola al registro de actividades (paso 5)
- 5a hecho: NewActivityLog ya no lleva points; el INSERT a point_events salió de PgActivityRepository.create; el servicio ya no calcula puntos. calculatePoints se queda en activity-service.ts porque la usa el worker.
- 5b hecho: ActivityService recibe (activities, pointsQueue) y, tras guardar la actividad, encola un PointsJob dentro de un try/catch.
- 5c PENDIENTE DE CONFIRMAR: crear backend/src/container.ts (instancia PgActivityRepository y InMemoryJobQueue<PointsJob>, y conecta el worker con pointsQueue.process), usarlo en activity-routes.ts (new ActivityService(activityRepository, pointsQueue)), y en server.ts guardar app.listen en "server" y agregar shutdown con SIGINT/SIGTERM (server.close, pointsQueue.stop, pool.end). Falta confirmar: que npx tsc --noEmit salga limpio, que al registrar una actividad aparezcan los 55 puntos (30 min + 5 km de Correr) al recargar, y hacer el commit y push (git add ., commit "feat: cola de puntos conectada al registro de actividades", push). Revisar que .env no aparezca en git status.
- Efecto: POST /activities ahora responde con points: 0; los puntos llegan un momento después. Ya se le avisó al compañero.

LO QUE FALTA DEL BACKEND (en este orden)
1. 5d: al arrancar, recalcular los puntos de actividades que quedaron sin point_events (la cola es en memoria y pierde trabajos si el servidor se reinicia).
2. Ranking tipo Sorted Set: interfaz en domain y una implementación en memoria (con posibilidad de cambiar a Redis), alimentada por el worker al guardar puntos.
3. WebSocket con la librería ws en ws://localhost:3000/ws/leaderboard. Mensaje: { "type": "leaderboard", "entries": [ { "position", "userId", "username", "points" } ] }. Además GET /leaderboard con el mismo arreglo "entries".
4. Retos: GET /challenges, POST /challenges (name, startsAt, endsAt), POST /challenges/:id/join, GET /challenges/:id/leaderboard (las tablas ya existen).
5. Rate limiting (sobre todo en login) y logs estructurados con x-correlation-id.
6. Usar requireRole en alguna ruta de administrador y una ruta para cerrar todas las sesiones de un usuario (revokeAllForUser ya existe en el repositorio).
7. Pruebas automatizadas (unitarias e integración).
8. Despliegue en la nube con capas gratuitas (Neon o Supabase para PostgreSQL, Render o Railway para el backend, Vercel o Netlify para el frontend).

CÓMO ARRANCAR
- Backend: cd ~/fitness-leaderboard-backend/backend && npm run dev (http://localhost:3000)
- Frontend: cd ~/fitness-leaderboard-backend/frontend && npm run dev (http://localhost:5173)
- Usuario de prueba: prueba@mail.com / clave12345
- pgAdmin no me abre, pero no afecta el proyecto: el servicio de PostgreSQL corre aparte.

AL EMPEZAR EL CHAT NUEVO: pídeme confirmar el estado del paso 5c (tsc, prueba de los 55 puntos y commit) antes de seguir con el 5d.