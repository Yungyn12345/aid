<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const scripts = []

if (config.public.yandexMetrikaId) {
  scripts.push({
    children: `
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(${config.public.yandexMetrikaId}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
    `
  })
}

if (config.public.googleTagId) {
  scripts.push(
    {
      src: `https://www.googletagmanager.com/gtag/js?id=${config.public.googleTagId}`,
      async: true
    },
    {
      children: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.public.googleTagId}');
      `
    }
  )
}

useHead({
  script: scripts
})
</script>
