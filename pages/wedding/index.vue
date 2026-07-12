<template>
  <div class="text-zinc-100">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-medium">💒 婚礼筹备</h1>
    </div>

    <main class="max-w-4xl">
      <!-- 功能卡片网格 -->
      <div class="grid grid-cols-2 gap-4">
        <NuxtLink to="/wedding/admin" class="group block">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-rose-500/50 transition-all">
            <div class="text-3xl mb-3">📋</div>
            <h2 class="text-lg font-semibold mb-2 group-hover:text-rose-400 transition-colors">宾客名单 (RSVP)</h2>
            <p class="text-sm text-zinc-500">管理宾客出席信息、人数统计及备注</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/finance" class="group block">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-rose-500/50 transition-all">
            <div class="text-3xl mb-3">💰</div>
            <h2 class="text-lg font-semibold mb-2 group-hover:text-rose-400 transition-colors">财务管理</h2>
            <p class="text-sm text-zinc-500">记录婚礼收支、礼金及预算控制</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/tasks" class="group block">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-rose-500/50 transition-all">
            <div class="text-3xl mb-3">✅</div>
            <h2 class="text-lg font-semibold mb-2 group-hover:text-rose-400 transition-colors">任务清单</h2>
            <p class="text-sm text-zinc-500">筹备期及婚礼当天的待办事项管理</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/timeline" class="group block">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-rose-500/50 transition-all">
            <div class="text-3xl mb-3">⏱️</div>
            <h2 class="text-lg font-semibold mb-2 group-hover:text-rose-400 transition-colors">流程时间轴</h2>
            <p class="text-sm text-zinc-500">婚礼当天的详细流程安排与人员分工</p>
          </div>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: '婚礼筹备 - Nestory'
})
</script>
