<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGlobalErrorHandler } from '~/composables/useGlobalErrorHandler'

const { interceptFetch, restoreFetch } = useGlobalErrorHandler()

// 在应用启动时设置全局错误拦截
onMounted(() => {
  interceptFetch()
})

// 在应用卸载时恢复原始fetch（可选）
onUnmounted(() => {
  restoreFetch()
})
</script>
