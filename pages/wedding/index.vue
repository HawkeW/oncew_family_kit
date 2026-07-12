<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">💒 婚礼筹备</h1>
    </div>

    <section class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <NuxtLink to="/wedding/rsvp" class="block group">
        <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-red-200">
          <div class="text-3xl mb-3">📋</div>
          <h2 class="text-xl font-semibold mb-2 group-hover:text-red-600">宾客名单 (RSVP)</h2>
          <p class="text-gray-500 text-sm">管理宾客出席信息、人数统计及备注。</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/wedding/finance" class="block group">
        <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-red-200">
          <div class="text-3xl mb-3">💰</div>
          <h2 class="text-xl font-semibold mb-2 group-hover:text-red-600">财务管理</h2>
          <p class="text-gray-500 text-sm">记录婚礼收支、礼金及预算控制。</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/wedding/tasks" class="block group">
        <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-red-200">
          <div class="text-3xl mb-3">✅</div>
          <h2 class="text-xl font-semibold mb-2 group-hover:text-red-600">任务清单</h2>
          <p class="text-gray-500 text-sm">筹备期及婚礼当天的待办事项管理。</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/wedding/timeline" class="block group">
        <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-transparent hover:border-red-200">
          <div class="text-3xl mb-3">⏱️</div>
          <h2 class="text-xl font-semibold mb-2 group-hover:text-red-600">流程时间轴</h2>
          <p class="text-gray-500 text-sm">婚礼当天的详细流程安排与人员分工。</p>
        </div>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '婚礼筹备 - Nestory'
})

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>
