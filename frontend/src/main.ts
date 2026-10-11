import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerAuthHandlers } from './api/client'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const auth = useAuthStore(pinia)
registerAuthHandlers({
  getToken: () => auth.accessToken,
  setToken: (token) => auth.setAccessToken(token),
  onSessionExpired: () => {
    auth.clearSession()
    void router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath, expired: '1' },
    })
  },
})

app.use(router)
app.mount('#app')
