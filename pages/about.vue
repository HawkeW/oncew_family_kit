<template>
  <div class="space-y-8">
    <section class="text-center py-8">
      <h1 class="text-4xl font-bold mb-4">关于 Oncew Family Kit</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">一个专注于家庭健康数据管理的开源工具</p>
    </section>

    <section class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">项目背景</h2>
      <p class="text-gray-600 mb-6">Oncew Family Kit 源于对家庭健康管理需求的深入思考。在现代生活中，跟踪和管理家庭成员的健康数据变得越来越重要，但市面上的工具往往过于复杂或缺乏针对性。我们希望通过这个简单而实用的工具，帮助家庭更好地管理健康数据。</p>
    </section>

    <section class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">核心功能</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-xl font-medium mb-2">经期记录</h3>
          <p class="text-gray-600">提供完整的月经周期跟踪功能，包括经期量、疼痛程度等关键指标的记录，帮助女性更好地了解自己的身体状况。</p>
        </div>
        <div>
          <h3 class="text-xl font-medium mb-2">大便记录</h3>
          <p class="text-gray-600">记录家庭成员的排便情况，包括舒适度、性状等信息，有助于及早发现潜在的健康问题。</p>
        </div>
      </div>
    </section>

    <section class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">特色优势</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-xl font-medium mb-2">简单易用</h3>
          <p class="text-gray-600">界面直观，操作简单，无需复杂设置即可开始使用。</p>
        </div>
        <div>
          <h3 class="text-xl font-medium mb-2">数据安全</h3>
          <p class="text-gray-600">采用本地存储方式，确保您的隐私数据安全可控。</p>
        </div>
        <div>
          <h3 class="text-xl font-medium mb-2">完全开源</h3>
          <p class="text-gray-600">代码完全开源，欢迎社区贡献，持续改进。</p>
        </div>
        <div>
          <h3 class="text-xl font-medium mb-2">离线可用</h3>
          <p class="text-gray-600">支持离线使用，不依赖网络连接。</p>
        </div>
      </div>
    </section>

    <section class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-semibold mb-4">未来规划</h2>
      <ul class="list-disc list-inside space-y-2 text-gray-600">
        <li>添加更多健康数据记录类型</li>
        <li>提供数据统计和分析功能</li>
        <li>支持多用户管理</li>
        <li>添加数据导出功能</li>
        <li>开发移动端应用</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
useHead({
  title: '关于我们 - Oncew Family Kit'
})
</script>