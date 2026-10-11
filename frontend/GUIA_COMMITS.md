# Commits sugeridos (uno por pieza)

Desde la raíz del repo, en la rama `frontend`. Ejecuta cada bloque cuando quieras guardar esa pieza.

```bash
git checkout -b frontend

git add frontend/package.json frontend/package-lock.json frontend/index.html frontend/vite.config.ts frontend/tsconfig*.json frontend/env.d.ts frontend/.env.example frontend/.gitignore frontend/public frontend/README.md frontend/src/main.ts frontend/src/App.vue frontend/src/assets
git commit -m "chore: crear proyecto Vue 3 con TypeScript, Router y Pinia"

git add frontend/src/types
git commit -m "feat: tipos User, Activity y ActivityType"

git add frontend/src/api
git commit -m "feat: cliente Axios con interceptor de refresh en 401"

git add frontend/src/stores/auth.ts
git commit -m "feat: tienda de autenticación con accessToken en memoria"

git add frontend/src/components/FormField.vue frontend/src/components/AuthLayout.vue frontend/src/components/AppHeader.vue frontend/src/views/LoginView.vue frontend/src/views/RegisterView.vue
git commit -m "feat: pantallas de login y registro"

git add frontend/src/router
git commit -m "feat: navigation guard para rutas privadas"

git add frontend/src/stores/activities.ts frontend/src/components/ActivityForm.vue frontend/src/views/ActivitiesView.vue
git commit -m "feat: listar, registrar y borrar actividades"

git add frontend/src/data frontend/src/views/LeaderboardView.vue
git commit -m "feat: pantalla del leaderboard con datos de ejemplo"

git add frontend/GUIA_COMMITS.md
git commit -m "docs: guía de commits"

git push -u origin frontend
```

Nota: los commits de las pantallas dependen del router y del store; si quieres que cada commit compile por separado, haz primero el de `router` y `stores`.
