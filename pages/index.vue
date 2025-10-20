<template>
  <div class="space-y-8">
    <section class="text-center py-8">
      <h1 class="text-4xl font-bold mb-4">Oncew Family Kit</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">简单记录，快乐生活</p>
    </section>

    <section class="grid md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 class="text-2xl font-semibold mb-3">经期记录</h2>
        <NuxtLink to="/menstrual-records" class="text-blue-600 hover:text-blue-800 font-medium">开始记录 →</NuxtLink>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h2 class="text-2xl font-semibold mb-3">便便记录</h2>
        <NuxtLink to="/stool-records" class="text-blue-600 hover:text-blue-800 font-medium">开始记录 →</NuxtLink>
      </div>
    </section>
  </div>
</template>