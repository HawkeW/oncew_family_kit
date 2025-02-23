// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@sidebase/nuxt-auth'],
  runtimeConfig: {
    auth: {
      name: 'nuxt-session',
      password: process.env.NUXT_AUTH_PASSWORD || '',
    },
  },
  auth: {
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth` : (process.env.AUTH_ORIGIN || 'http://localhost:3000'),
    provider: {
      type: 'local',
      session: {
        dataType: {
          id: 'string | number',
          email: 'string',
        },
      },
      endpoints: {
        signIn: { path: '/api/auth/login', method: 'post' },
        signOut: { path: '/api/auth/logout', method: 'post' },
        signUp: { path: '/api/auth/register', method: 'post' },
        getSession: { path: '/api/auth/profile', method: 'get' },
      }
    }
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  tailwindcss: {
    config: {
      content: [],
      theme: {
        extend: {}
      }
    }
  }
})