<template>
  <div class="relative min-h-screen overflow-hidden bg-ink text-cream">
    <div class="pointer-events-none absolute inset-0 bg-mesh opacity-95" />
    <div class="pointer-events-none absolute inset-x-0 top-[-18rem] h-[34rem] rounded-full bg-accent/15 blur-3xl" />
    <div class="pointer-events-none absolute bottom-[-10rem] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-coral/10 blur-3xl" />
    <div class="relative">
      <slot />
    </div>
  </div>
</template>
