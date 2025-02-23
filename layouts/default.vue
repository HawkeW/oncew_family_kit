<template>
  <div>
    <header class="bg-gray-800 text-white p-4">
      <nav class="container mx-auto">
        <NuxtLink to="/" class="mr-4">首页</NuxtLink>
        <NuxtLink to="/menstrual-records" class="mr-4">经期记录</NuxtLink>
        <NuxtLink to="/stool-records" class="mr-4">便便记录</NuxtLink>
        <NuxtLink to="/about" class="mr-4">关于</NuxtLink>
      </nav>
    </header>
    <main class="container mx-auto p-4">
      <slot />
    </main>
    <footer class="bg-gray-800 text-white p-4 mt-8">
      <div class="container mx-auto">
        © 2024 Oncew Family Kit
      </div>
    </footer>
  </div>
</template>