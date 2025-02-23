<template>
  <div class="space-y-8">
    <section class="text-center py-8">
      <h1 class="text-4xl font-bold mb-4">Oncew Family Kit</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">您的家庭健康数据管理助手，帮助您轻松记录和追踪家庭成员的健康状况。</p>
    </section>

    <section class="grid md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 class="text-2xl font-semibold mb-3">经期记录</h2>
        <p class="text-gray-600 mb-4">轻松记录和追踪月经周期，包括经期量、疼痛程度等重要指标，帮助您更好地了解自己的身体状况。</p>
        <NuxtLink to="/menstrual-records" class="text-blue-600 hover:text-blue-800 font-medium">开始记录 →</NuxtLink>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 class="text-2xl font-semibold mb-3">便便记录</h2>
        <p class="text-gray-600 mb-4">记录排便情况，包括舒适度、性状等信息，帮助您监控家人的肠道健康状况。</p>
        <NuxtLink to="/stool-records" class="text-blue-600 hover:text-blue-800 font-medium">开始记录 →</NuxtLink>
      </div>
    </section>

    <section class="bg-gray-50 p-8 rounded-lg">
      <h2 class="text-2xl font-semibold mb-6 text-center">使用指南</h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-4xl mb-4">📝</div>
          <h3 class="font-semibold mb-2">简单记录</h3>
          <p class="text-gray-600">直观的界面设计，让数据记录变得轻松简单</p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="font-semibold mb-2">数据追踪</h3>
          <p class="text-gray-600">清晰的历史记录展示，帮助您掌握健康趋势</p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">🔒</div>
          <h3 class="font-semibold mb-2">隐私保护</h3>
          <p class="text-gray-600">本地数据存储，确保您的隐私安全</p>
        </div>
      </div>
    </section>
  </div>
</template>