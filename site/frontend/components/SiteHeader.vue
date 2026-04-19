<template>
  <header class="shell sticky top-0 z-30 pt-4">
    <div class="glass-card flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p class="font-display text-lg uppercase tracking-[0.14em] text-cream">AIDDoc</p>
        <p class="text-sm text-mist/70">АИ Декларант для команд ВЭД</p>
      </div>
      <nav class="hidden items-center gap-6 text-sm text-mist/75 lg:flex">
        <a href="#problems" class="transition hover:text-cream">Проблемы</a>
        <a href="#workflow" class="transition hover:text-cream">Как работает</a>
        <a href="#contact" class="transition hover:text-cream">Контакты</a>
      </nav>
      <CtaButton source="header" />
    </div>
  </header>
</template>
