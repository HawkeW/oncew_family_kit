<template>
  <div class="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
    <div class="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(63,63,70,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(63,63,70,0.16)_1px,transparent_1px)] [background-size:28px_28px]" />
    <div class="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
    <div class="pointer-events-none absolute right-12 top-1/3 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />

    <div class="relative mx-auto max-w-6xl px-6 py-14 md:py-18">
      <section class="rounded-2xl border border-zinc-800/80 bg-zinc-900/55 p-8 md:p-10 backdrop-blur">
        <p class="text-xs tracking-[0.22em] text-zinc-500 uppercase">Oncew Family Kit</p>
        <h1 class="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl">Datalize your life.</h1>
        <p class="mt-4 max-w-2xl text-base text-zinc-400 md:text-lg">把日常变成可回看的轨迹，让每次记录都留下意义。</p>
      </section>

      <section class="pt-10">
        <div class="mb-5 flex items-end justify-between">
          <h2 class="text-xl font-semibold text-zinc-100 md:text-2xl">记录</h2>
          <p class="text-sm text-zinc-500">Daily Logs</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <NuxtLink to="/records/menstrual" class="group block">
            <article class="h-full rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:bg-zinc-900/90 hover:shadow-[0_14px_38px_-24px_rgba(34,211,238,0.7)]">
              <div class="flex items-center justify-between">
                <p class="text-xs tracking-[0.16em] text-zinc-500 uppercase">Health</p>
                <span class="inline-flex rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400">01</span>
              </div>
              <h3 class="mt-5 text-xl font-medium text-zinc-100">经期记录</h3>
              <p class="mt-2 text-sm leading-6 text-zinc-400">记录经期时间、流量和身体状态，形成连续健康档案。</p>
            </article>
          </NuxtLink>
          <NuxtLink to="/records/stool" class="group block">
            <article class="h-full rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:bg-zinc-900/90 hover:shadow-[0_14px_38px_-24px_rgba(34,211,238,0.7)]">
              <div class="flex items-center justify-between">
                <p class="text-xs tracking-[0.16em] text-zinc-500 uppercase">Digestive</p>
                <span class="inline-flex rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400">02</span>
              </div>
              <h3 class="mt-5 text-xl font-medium text-zinc-100">便便记录</h3>
              <p class="mt-2 text-sm leading-6 text-zinc-400">记录排便频率、性状和体感，长期观察肠道变化。</p>
            </article>
          </NuxtLink>
        </div>
      </section>

      <section class="pt-10">
        <div class="mb-5 flex items-end justify-between">
          <h2 class="text-xl font-semibold text-zinc-100 md:text-2xl">人生</h2>
          <p class="text-sm text-zinc-500">Life Projects</p>
        </div>
        <NuxtLink to="/wedding" class="group block">
          <article class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-7 md:p-8 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300/55 hover:bg-zinc-900/90 hover:shadow-[0_16px_44px_-26px_rgba(251,113,133,0.7)]">
            <div class="flex items-center justify-between">
              <p class="text-xs tracking-[0.16em] text-zinc-500 uppercase">Project</p>
              <span class="inline-flex rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400">03</span>
            </div>
            <h3 class="mt-5 text-2xl font-medium text-zinc-100">婚礼筹备</h3>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">宾客名单、财务管理、任务清单与流程时间轴，统一管理婚礼全周期。</p>
            <p class="mt-7 inline-flex text-sm text-zinc-300 transition-colors group-hover:text-rose-300">进入模块</p>
          </article>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Datalize your life. - Oncew Family Kit'
})
</script>
