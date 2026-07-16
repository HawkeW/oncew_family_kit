<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">生活记录</h1>
    </div>

    <section class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink to="/records/menstrual" class="block group">
        <div class="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-primary/20">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">🩸</span>
            <h2 class="text-xl font-semibold group-hover:text-pink-600 transition-colors">经期记录</h2>
          </div>
          <p class="text-muted-foreground">记录经期时间、流量及身体状况，追踪生理健康�?/p>
        </div>
      </NuxtLink>

      <NuxtLink to="/records/stool" class="block group">
        <div class="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-primary/20">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">💩</span>
            <h2 class="text-xl font-semibold group-hover:text-yellow-600 transition-colors">便便记录</h2>
          </div>
          <p class="text-muted-foreground">记录排便情况、性状及舒适度，关注肠道健康�?/p>
        </div>
      </NuxtLink>

      <NuxtLink to="/groups" class="block group">
        <div class="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-primary/20">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">👥</span>
            <h2 class="text-xl font-semibold group-hover:text-blue-600 transition-colors">群组管理</h2>
          </div>
          <p class="text-muted-foreground">管理家庭群组、成员邀请及权限设置�?/p>
        </div>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '生活记录 - Nestory'
})

definePageMeta({
  middleware: 'auth'
})
</script>
