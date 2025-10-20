<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">注册</h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm -space-y-px">
          <FormField name="username">
            <FormItem>
              <FormControl>
                <Input v-model="formData.username" type="text" placeholder="用户名 (3-20个字符)" required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="email">
            <FormItem>
              <FormControl>
                <Input v-model="formData.email" type="email" placeholder="邮箱" required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="password">
            <FormItem>
              <FormControl>
                <Input v-model="formData.password" type="password" placeholder="密码 (至少6个字符)" required
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <div>
          <Button type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            注册
          </Button>
        </div>

        <div class="text-center">
          <NuxtLink to="/login" class="text-sm text-primary hover:text-primary/90">已有账号？点击登录</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

useHead({
  title: '注册 - Oncew Family Kit'
})

const router = useRouter()
const formData = ref({
  username: '',
  email: '',
  password: ''
})

async function handleRegister() {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })

    if (response.ok) {
      const user = await response.json()
      // 注册成功，跳转到登录页
      router.push('/login')
    } else {
      const error = await response.json()
      alert(error.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    alert('注册失败，请稍后重试')
  }
}
</script>