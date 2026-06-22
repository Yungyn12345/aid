<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="text-xl font-bold">
          AIDoc
        </NuxtLink>

        <nav class="flex items-center gap-4 text-sm text-slate-600">
          <NuxtLink to="/" class="hover:text-slate-950">
            Главная
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>