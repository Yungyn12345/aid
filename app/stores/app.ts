export const useAppStore = defineStore('app', () => {
  const counter = ref(0)

  const increment = () => {
    counter.value += 1
  }

  return {
    counter,
    increment,
  }
})