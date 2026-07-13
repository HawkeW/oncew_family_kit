<template>
  <div class="space-y-12 py-8">
    <section class="text-center space-y-4">
      <h1 class="text-4xl font-bold tracking-tight">Oncew Family Kit</h1>
      <p class="text-xl text-gray-600">简单记录，快乐生活</p>
    </section>

    <!-- Wedding Section -->
    <section>
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-2xl font-bold">💒 婚礼筹备</h2>
        <span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">Finished</span>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NuxtLink to="/wedding/admin" class="block group">
          <div
            class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-red-200 h-full">
            <div class="mb-4 text-3xl">📋</div>
            <h3 class="text-lg font-semibold mb-2 group-hover:text-red-600">宾客名单 (RSVP)</h3>
            <p class="text-sm text-gray-500">管理宾客出席信息、人数统计及备注。</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/finance" class="block group">
          <div
            class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-red-200 h-full">
            <div class="mb-4 text-3xl">💰</div>
            <h3 class="text-lg font-semibold mb-2 group-hover:text-red-600">财务管理</h3>
            <p class="text-sm text-gray-500">记录婚礼收支、礼金及预算控制。</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/tasks" class="block group">
          <div
            class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-red-200 h-full">
            <div class="mb-4 text-3xl">✅</div>
            <h3 class="text-lg font-semibold mb-2 group-hover:text-red-600">任务清单</h3>
            <p class="text-sm text-gray-500">筹备期及婚礼当天的待办事项管理。</p>
          </div>
        </NuxtLink>

        <NuxtLink to="/wedding/timeline" class="block group">
          <div
            class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-red-200 h-full">
            <div class="mb-4 text-3xl">⏱️</div>
            <h3 class="text-lg font-semibold mb-2 group-hover:text-red-600">流程时间轴</h3>
            <p class="text-sm text-gray-500">婚礼当天的详细流程安排与人员分工。</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Other Records Section -->
    <!-- <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">📂 其他记录</h2>
        <NuxtLink to="/records" class="text-primary hover:underline flex items-center gap-1">
          查看全部 <span class="i-heroicons-arrow-right w-4 h-4"></span>
        </NuxtLink>
      </div>

      <NuxtLink to="/records" class="block">
        <div class="bg-gray-50 rounded-xl p-8 border border-dashed border-gray-300 hover:border-primary/50 hover:bg-primary/5 transition-colors text-center">
          <div class="flex justify-center gap-4 mb-4 text-3xl opacity-50">
            <span>🩸</span>
            <span>💩</span>
            <span>👥</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">生活记录归档</h3>
          <p class="text-gray-500 max-w-md mx-auto">包含经期记录、便便记录及群组管理等日常功能。</p>
        </div>
      </NuxtLink>
    </section> -->
  </div>
</template>

<script setup>
useHead({
  title: 'Oncew Family Kit - 简单记录，快乐生活'
})
</script>
