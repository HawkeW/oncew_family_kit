// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.png' }
      ]
    }
  },
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
    baseURL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.AUTH_ORIGIN || 'http://localhost:3000'),
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
    cssPath: '~/assets/css/tailwind.css',
    config: {
      content: [],
      theme: {
        extend: {
          colors: {
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            card: 'var(--card)',
            'card-foreground': 'var(--card-foreground)',
            popover: 'var(--popover)',
            'popover-foreground': 'var(--popover-foreground)',
            primary: {
              DEFAULT: 'var(--primary)',
              foreground: 'var(--primary-foreground)',
            },
            secondary: {
              DEFAULT: 'var(--secondary)',
              foreground: 'var(--secondary-foreground)',
            },
            muted: {
              DEFAULT: 'var(--muted)',
              foreground: 'var(--muted-foreground)',
            },
            accent: {
              DEFAULT: 'var(--accent)',
              foreground: 'var(--accent-foreground)',
            },
            destructive: {
              DEFAULT: 'var(--destructive)',
              foreground: 'var(--destructive-foreground)',
            },
            border: 'var(--border)',
            input: 'var(--input)',
            ring: 'var(--ring)',
            // 语义化主题色
            'theme-action': 'var(--theme-action)',
            'theme-action-light': 'var(--theme-action-light)',
            'theme-success': 'var(--theme-success)',
            'theme-success-light': 'var(--theme-success-light)',
            'theme-danger': 'var(--theme-danger)',
            'theme-danger-light': 'var(--theme-danger-light)',
            'theme-warning': 'var(--theme-warning)',
            'theme-warning-light': 'var(--theme-warning-light)',
            'theme-menstrual': 'var(--theme-menstrual)',
            'theme-menstrual-light': 'var(--theme-menstrual-light)',
            'theme-stool': 'var(--theme-stool)',
            'theme-stool-light': 'var(--theme-stool-light)',
            'theme-timeline': 'var(--theme-timeline)',
          }
        }
      }
    }
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    externals: {
      external: ['better-sqlite3']
    }
  }
})