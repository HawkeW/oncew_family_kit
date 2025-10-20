<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">登录</h2>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <FormField name="email">
            <FormItem>
              <FormControl>
                <Input v-model="formData.email" type="text" placeholder="邮箱" required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="password">
            <FormItem>
              <FormControl>
                <Input v-model="formData.password" type="password" placeholder="密码" required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <div>
          <Button type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            登录
          </Button>
        </div>
      </form>

      <div class="text-center mt-4">
        <NuxtLink to="/register" class="text-sm text-primary hover:text-primary/90">没有账号？点击注册</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCustomAuthState } from '~/composables/useCustomAuthState'

useHead({
  title: '登录 - Oncew Family Kit'
})

const router = useRouter()
const route = useRoute()
const { setLoggedIn } = useCustomAuthState()

const formData = ref({
  email: '',
  password: ''
})

async function handleLogin() {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })

    if (response.ok) {
      const userData = await response.json()
      // 更新全局认证状态
      setLoggedIn(true, userData)
      
      // 检查是否有返回地址参数
      const redirectUrl = route.query.redirect as string
      if (redirectUrl) {
        router.push(redirectUrl)
      } else {
        router.push('/')
      }
    } else {
      const error = await response.json()
      alert(error.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    alert('登录失败，请稍后重试')
  }
}
</script>