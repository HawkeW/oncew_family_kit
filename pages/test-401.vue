<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8">测试401错误拦截</h1>
    
    <div class="space-y-4">
      <Button @click="testNormalRequest" class="mr-4">
        测试正常请求
      </Button>
      
      <Button @click="test401Request" variant="destructive">
        测试401错误请求
      </Button>
      
      <div v-if="result" class="mt-4 p-4 border rounded">
        <h3 class="font-semibold mb-2">请求结果:</h3>
        <pre class="text-sm">{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

useHead({
  title: '401错误测试 - Oncew Family Kit'
})

const result = ref('')

// 测试正常请求
async function testNormalRequest() {
  try {
    const response = await fetch('/api/auth/profile')
    const data = await response.json()
    result.value = `正常请求 - 状态码: ${response.status}\n响应: ${JSON.stringify(data, null, 2)}`
  } catch (error) {
    result.value = `正常请求失败: ${error.message}`
  }
}

// 测试401错误请求（模拟未授权访问）
async function test401Request() {
  try {
    // 发送一个会返回401的请求（假设这个端点需要认证）
    const response = await fetch('/api/groups', {
      headers: {
        'Authorization': 'Bearer invalid-token' // 无效token
      }
    })
    
    const data = await response.text()
    result.value = `401测试请求 - 状态码: ${response.status}\n响应: ${data}`
    
    if (response.status === 401) {
      result.value += '\n\n注意: 如果全局拦截器工作正常，应该会自动跳转到登录页面'
    }
  } catch (error) {
    result.value = `401测试请求失败: ${error.message}`
  }
}
</script>