<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tag?: string
    delay?: number
    class?: string
  }>(),
  {
    tag: 'div',
    delay: 0,
    class: ''
  }
)

const root = ref<HTMLElement | null>(null)
const visible = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    {
      threshold: 0.2
    }
  )

  if (root.value) {
    observer.observe(root.value)
  }
})
</script>

<template>
  <component
    :is="props.tag"
    ref="root"
    :class="['reveal-enter', visible && 'reveal-visible', props.class]"
    :style="{ transitionDelay: `${props.delay}ms` }"
  >
    <slot />
  </component>
</template>
