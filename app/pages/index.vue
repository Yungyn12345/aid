<script setup lang="ts">
import { definePageMeta } from '#imports'
import type { ComponentPublicInstance } from 'vue'

definePageMeta({
  layout: 'landing',
})

useHead({
  title: 'AI Doc',
})

type AudienceCard = {
  title: string
  text: string
  image: string
  alt: string
}

type AudienceFrameState = {
  topOffset: number
  bottomOffset: number
}

type HowItWorksSlide = {
  step: string
  title: string
  description: string
  points?: string[]
  image: string
  alt: string
}

type WhyChooseUsSlide = {
  title: string
  text: string
  image: string
  alt: string
}

const audienceCards: AudienceCard[] = [
  {
    title: 'ДЕКЛАРАНТАМ',
    text: 'Когда на вас десятки документов, сжатые сроки и цена ошибки слишком высока.',
    image: '/aidoc/declarantam.png',
    alt: 'Иконка для декларантов',
  },
  {
    title: 'ТАМОЖЕННЫМ БРОКЕРАМ',
    text: 'Когда нужно ускорять оформление, снижать нагрузку на команду и держать качество на потоке.',
    image: '/aidoc/tammozhenim_brokerom.png',
    alt: 'Иконка для таможенных брокеров',
  },
  {
    title: 'КОМПАНИЯМ С ОТДЕЛОМ ВЭД',
    text: 'Когда важно, чтобы внутренняя команда оформляла ДТ быстрее, стабильнее и без лишних потерь времени.',
    image: '/aidoc/companiya_s__otdelom_vad.png',
    alt: 'Иконка для компаний с отделом ВЭД',
  },
]

const howItWorksSlides: HowItWorksSlide[] = [
  {
    step: 'шаг 1',
    title: 'Загрузка документов',
    description: 'Вы загружаете инвойсы, спецификации, упаковочные листы и другие документы. Система извлекает данные и подготавливает основу для декларации.',
    points: [
      'загрузка файлов',
      'распознавание документов',
      'подготовка данных к заполнению',
    ],
    image: '/aidoc/howitworks/zagruzka.png',
    alt: 'Экран загрузки документов',
  },
  {
    step: 'шаг 2',
    title: 'ИИ-анализ данных',
    description: 'ИИ анализирует документы, сопоставляет поля и помогает найти места, где могут появиться ошибки или расхождения.',
    points: [
      'извлечение данных из документов',
      'сопоставление значений',
      'подсказки по спорным полям',
    ],
    image: '/aidoc/howitworks/ii_analiz.png',
    alt: 'Экран анализа данных ИИ',
  },
  {
    step: 'шаг 3',
    title: 'Проверка специалистом',
    description: 'Специалист проверяет результат, вносит финальные правки и завершает оформление.',
    points: [
      'контроль качества',
      'подтверждение корректности',
      'финальная отправка по процессу',
    ],
    image: '/aidoc/howitworks/proverka.png',
    alt: 'Экран проверки специалистом',
  },
]

const whyChooseUsSlides: WhyChooseUsSlide[] = [
  {
    title: 'Меньше ручного труда',
    text: 'Система берет на себя извлечение данных и подготовку заполнения из загруженных документов.',
    image: '/aidoc/whychooseus/menishe_ruchnogo_truda.png',
    alt: 'Иллюстрация про снижение ручного труда',
  },
  {
    title: 'Быстрее поток',
    text: 'Команда тратит меньше времени на повторяющиеся операции и быстрее обрабатывает заявки.',
    image: '/aidoc/whychooseus/bistree_potok.png',
    alt: 'Иллюстрация про ускорение потока заявок',
  },
  {
    title: 'Меньше ошибок',
    text: 'Снижается риск потерь из-за опечаток, пропусков и человеческого фактора в типовых сценариях.',
    image: '/aidoc/whychooseus/menishe_oshibok.png',
    alt: 'Иллюстрация про снижение ошибок',
  },
  {
    title: 'Прозрачнее процесс',
    text: 'Руководитель видит, где у команды узкие места и какой этап требует больше всего времени.',
    image: '/aidoc/whychooseus/prozrachnee_prozes.png',
    alt: 'Иллюстрация про прозрачность процесса',
  },
]

const activeHowItWorksIndex = ref(2)

const activeHowItWorksSlide = computed<HowItWorksSlide>(() => {
  return howItWorksSlides[activeHowItWorksIndex.value] ?? howItWorksSlides[0]!
})

const setHowItWorksSlide = (index: number) => {
  if (!howItWorksSlides[index]) {
    return
  }

  activeHowItWorksIndex.value = index
}

const showPreviousHowItWorksSlide = () => {
  activeHowItWorksIndex.value =
    activeHowItWorksIndex.value === 0
      ? howItWorksSlides.length - 1
      : activeHowItWorksIndex.value - 1
}

const showNextHowItWorksSlide = () => {
  activeHowItWorksIndex.value =
    activeHowItWorksIndex.value === howItWorksSlides.length - 1
      ? 0
      : activeHowItWorksIndex.value + 1
}

const activeWhyChooseUsIndex = ref(0)

const activeWhyChooseUsSlide = computed<WhyChooseUsSlide>(() => {
  return whyChooseUsSlides[activeWhyChooseUsIndex.value] ?? whyChooseUsSlides[0]!
})

const showPreviousWhyChooseUsSlide = () => {
  activeWhyChooseUsIndex.value =
    activeWhyChooseUsIndex.value === 0
      ? whyChooseUsSlides.length - 1
      : activeWhyChooseUsIndex.value - 1
}

const showNextWhyChooseUsSlide = () => {
  activeWhyChooseUsIndex.value =
    activeWhyChooseUsIndex.value === whyChooseUsSlides.length - 1
      ? 0
      : activeWhyChooseUsIndex.value + 1
}

const audienceCardRefs = ref<HTMLElement[]>([])

const audienceFrameList = ref<AudienceFrameState[]>(
  audienceCards.map(() => ({
    topOffset: 7,
    bottomOffset: 57,
  })),
)

const lerp = (from: number, to: number, progress: number) => {
  return from + (to - from) * progress
}

const setAudienceCardRef = (
  el: Element | ComponentPublicInstance | null,
  index: number,
) => {
  if (el instanceof HTMLElement) {
    audienceCardRefs.value[index] = el
  }
}

const getAudienceFrameStyle = (index: number) => {
  const state = audienceFrameList.value[index]

  return {
    '--line-top-offset': String(state?.topOffset ?? 7),
    '--line-bottom-offset': String(state?.bottomOffset ?? 57),
  }
}

const updateAudienceCardsProgress = () => {
  const viewportHeight = window.innerHeight

  /**
   * Старт: когда карточка почти полностью появилась.
   * Финиш: когда карточка дошла ближе к середине экрана.
   */
  const startLine = viewportHeight * 0.92
  const endLine = viewportHeight * 0.55

  audienceCardRefs.value.forEach((card, index) => {
    if (!card) {
      return
    }

    const rect = card.getBoundingClientRect()

    /**
     * Используем bottom, а не center.
     * Так анимация стартует не когда карточка только появилась,
     * а когда она почти вся уже внутри экрана.
     */
    const rawProgress = (startLine - rect.bottom) / (startLine - endLine)
    const progress = Math.min(Math.max(rawProgress, 0), 1)

    audienceFrameList.value[index] = {
      topOffset: lerp(80, 100, progress),
      bottomOffset: lerp(0, 50, progress),
    }
  })
}

onMounted(() => {
  updateAudienceCardsProgress()

  window.addEventListener('scroll', updateAudienceCardsProgress, { passive: true })
  window.addEventListener('resize', updateAudienceCardsProgress)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateAudienceCardsProgress)
  window.removeEventListener('resize', updateAudienceCardsProgress)
})
</script>

<template>
  <main class="min-h-screen bg-white p-2.5 text-white sm:p-4 lg:p-5 text-center font-sans font-bold leading-none tracking-normal text-[1rem]">
    <section
      class="relative flex max-h-[780px] overflow-hidden rounded-[18px] bg-brand px-4 pb-0 pt-5  sm:px-6  lg:px-8"
    >
      <div class="relative z-10 mx-auto flex w-full max-w-[1860px] flex-col">
        <header class="grid grid-cols-[auto_1fr] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <NuxtLink to="/" aria-label="AI Doc" class="inline-flex w-fit items-center">
            <img
              src="/aidoc/logo.svg"
              alt="AI Doc"
              class="h-10 w-[60px] shrink-0"
            >
          </NuxtLink>

          <nav class="hidden items-center justify-center gap-5 lg:flex">
            <a href="#subscribe" class="hero-nav-link">ПОДПИСАТЬСЯ</a>
            <a href="#about" class="hero-nav-link">О НАС</a>
            <a href="#contact" class="hero-nav-link">СВЯЗАТЬСЯ</a>
          </nav>

          <div class="flex justify-end">
            <NuxtLink to="/AiDeclarant" class="hero-secondary-button">
              ЗАПОЛНИТЬ ДЕКЛАРАЦИЮ
            </NuxtLink>
          </div>
        </header>

        <div class="flex flex-1 flex-col items-center justify-between pt-14 text-center sm:pt-16 lg:pt-20">
          <div class="mx-auto max-w-[950px]">
            <h1 class="font-sans text-[2rem] text-center font-bold leading-none tracking-normal">
              АИ Декларант — оформление таможенных деклараций быстрее, чище и с меньшим числом ошибок
            </h1>

            <p class="mx-auto mt-5 max-w-[786px]">
              ИИ-платформа для декларантов, брокеров и ВЭД-отделов, которая автоматически извлекает данные из документов, помогает заполнить ДТ и сокращает объем ручной работы.
            </p>

            <NuxtLink
              id="subscribe"
              to="/AiDeclarant"
              class="mt-12 inline-flex min-h-[60px] items-center justify-center rounded-[14px] bg-brand-yellow px-7 font-sans text-base font-bold leading-none tracking-normal text-brand transition hover:-translate-y-0.5 hover:shadow-lg sm:min-w-[300px]"
            >
              ПОЛУЧИТЬ ДЕМО ВЕРСИЮ
            </NuxtLink>
          </div>

          <div class="mt-16 w-full max-w-[1000px] overflow-hidden rounded-t-[14px] border border-white/35 bg-white shadow-2xl shadow-black/20">
            <img
              src="/aidoc/hero_photo.png"
              alt="Интерфейс заполнения декларации"
              class="block h-auto w-full"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- AUDIENCE -->
    <section id="about" class="audience-section">
      <h2 class="title audience-title">
        КОМУ ПОДХОДИТ АИ ДЕКЛАРАНТ
      </h2>

      <div class="audience-grid">
        <article
          v-for="(card, index) in audienceCards"
          :key="card.title"
          :ref="(el) => setAudienceCardRef(el, index)"
          class="audience-card"
          :style="getAudienceFrameStyle(index)"
        >
          <svg
            class="audience-card__frame"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              pathLength="100"
              d="M 14 1.5 H 86 Q 98.5 1.5 98.5 14 V 86 Q 98.5 98.5 86 98.5 H 14 Q 1.5 98.5 1.5 86 V 14 Q 1.5 1.5 14 1.5"
              class="audience-card__frame-base"
            />

            <path
              pathLength="100"
              d="M 14 1.5 H 86 Q 98.5 1.5 98.5 14 V 86 Q 98.5 98.5 86 98.5 H 14 Q 1.5 98.5 1.5 86 V 14 Q 1.5 1.5 14 1.5"
              class="audience-card__frame-accent audience-card__frame-accent--top"
            />

            <path
              pathLength="100"
              d="M 14 1.5 H 86 Q 98.5 1.5 98.5 14 V 86 Q 98.5 98.5 86 98.5 H 14 Q 1.5 98.5 1.5 86 V 14 Q 1.5 1.5 14 1.5"
              class="audience-card__frame-accent audience-card__frame-accent--bottom"
            />
          </svg>

          <img
            :src="card.image"
            :alt="card.alt"
            class="audience-card__icon"
          >

          <h3 class="audience-card__title">
            {{ card.title }}
          </h3>

          <p class="audience-card__text">
            {{ card.text }}
          </p>
        </article>
      </div>
    </section>

     <!-- WHY CHOOSE US -->
    <section class="why-section">
      <h2 class="title why-title">
        ПОЧЕМУ ВЫБИРАЮТ НАС
      </h2>

      <div class="why-layout">
        <div class="why-left">
          <div class="why-copy">
            <h3 class="why-copy__title">
              Не просто поле для ручного ввода, а рабочий инструмент для ускорения оформления
            </h3>

            <p class="why-copy__text">
              АИ Декларант помогает убрать рутину из типовых операций и оставить специалисту главное — контроль, проверку и принятие решений.
            </p>
          </div>

          <div class="why-image-frame">
            <Transition name="why-fade" mode="out-in">
              <img
                :key="activeWhyChooseUsSlide.image"
                :src="activeWhyChooseUsSlide.image"
                :alt="activeWhyChooseUsSlide.alt"
                class="why-image"
              >
            </Transition>
          </div>
        </div>

        <article class="why-card">
          <Transition name="why-fade" mode="out-in">
            <div
              :key="activeWhyChooseUsSlide.title"
              class="why-card__content"
            >
              <p class="yello-text why-card__title">
                {{ activeWhyChooseUsSlide.title }}
              </p>

              <p class="why-card__text">
                {{ activeWhyChooseUsSlide.text }}
              </p>
            </div>
          </Transition>

          <div class="why-arrows" aria-label="Переключение преимуществ">
            <button
              type="button"
              class="why-arrow"
              aria-label="Предыдущее преимущество"
              @click="showPreviousWhyChooseUsSlide"
            >
              ←
            </button>

            <button
              type="button"
              class="why-arrow"
              aria-label="Следующее преимущество"
              @click="showNextWhyChooseUsSlide"
            >
              →
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="how-section">
      <h2 class="title how-title">
        КАК ЭТО РАБОТАЕТ
      </h2>

      <div class="how-slider">
        <p class="how-subtitle">
          Три шага вместо бесконечной ручной рутины
        </p>

        <div class="how-card">
          <div class="how-left">
            <div class="how-tabs" aria-label="Шаги работы">
              <button
                v-for="(slide, index) in howItWorksSlides"
                :key="slide.step"
                type="button"
                class="how-tab"
                :class="{ 'how-tab--active': activeHowItWorksIndex === index }"
                @click="setHowItWorksSlide(index)"
              >
                {{ slide.step }}
              </button>
            </div>

            <Transition name="how-fade" mode="out-in">
              <div
                :key="activeHowItWorksSlide.title"
                class="how-text-card"
              >
                <p class="yello-text how-text-card__title">
                  {{ activeHowItWorksSlide.title }}
                </p>

                <div class="how-text-card__description">
                  <p>
                    {{ activeHowItWorksSlide.description }}
                  </p>

                  <ul
                    v-if="activeHowItWorksSlide.points?.length"
                    class="how-text-card__list"
                  >
                    <li
                      v-for="point in activeHowItWorksSlide.points"
                      :key="point"
                    >
                      {{ point }}
                    </li>
                  </ul>
                </div>
              </div>
            </Transition>

            <div class="how-arrows" aria-label="Переключение шагов">
              <button
                type="button"
                class="how-arrow"
                aria-label="Предыдущий шаг"
                @click="showPreviousHowItWorksSlide"
              >
                ←
              </button>

              <button
                type="button"
                class="how-arrow"
                aria-label="Следующий шаг"
                @click="showNextHowItWorksSlide"
              >
                →
              </button>
            </div>
          </div>

          <div class="how-image-wrap">
            <Transition name="how-fade" mode="out-in">
              <img
                :key="activeHowItWorksSlide.image"
                :src="activeHowItWorksSlide.image"
                :alt="activeHowItWorksSlide.alt"
                class="how-image"
              >
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA / FORM -->
    <section id="contact" class="request-section">
      <h2 class="title">ОСТАВЬТЕ ЗАЯВКУ</h2>

      <div class="request-card">
        <div class="request-info">
          <p class="yello-text mb-[20px]">
            Покажем, как АИ Декларант<br>
            впишется в ваш процесс
          </p>

          <p >
            Что вы получите после заявки:
          </p>

          <ul class="request-list">
            <li>краткую презентацию продукта</li>
            <li>разбор вашего сценария оформления ДТ</li>
            <li>понимание, где именно можно ускорить работу команды</li>
          </ul>
        </div>

        <form class="request-form">
          <label class="request-field">
            <span>Имя</span>
            <input type="text" placeholder="Ваше имя">
          </label>

          <label class="request-field">
            <span>Компания</span>
            <input type="text" placeholder="Название компании">
          </label>

          <label class="request-field">
            <span>Телефон</span>
            <input type="tel" placeholder="+7 ...">
          </label>

          <label class="request-field">
            <span>Электронная почта</span>
            <input type="email" placeholder="@">
          </label>

          <button type="submit" class="yellow-button request-submit">
            ОТПРАВИТЬ ЗАЯВКУ
          </button>
        </form>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer-section">
      <div class="footer-content">
        <div class="footer-contacts">
          <p class="yello-text">По сотрудничеству:</p>

          <p>
            TELEGRAM:
            <a href="https://t.me/YUNGYUNGO_0" target="_blank" rel="noopener noreferrer">
              @YUNGYUNGO_0
            </a>
          </p>

          <p>
            ПОЧТА:
            <a href="mailto:CHZHEN.YG@DVFU.RU">
              CHZHEN.YG@DVFU.RU
            </a>
          </p>
        </div>

        <NuxtLink to="/AiDeclarant" class="yellow-button footer-button">
          ПОЛУЧИТЬ ДЕМОТ ВЕРСИЮ
        </NuxtLink>
      </div>
    </footer>
  </main>
</template>

<style scoped>
  .hero-nav-link {
    display: inline-flex;
    min-width: 104px;
    min-height: 40px;
    align-items: center;
    justify-content: center;
    border: 1px solid #fcd95a;
    border-radius: 10px;
    padding: 0 26px;
    font-family: Inter, system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    text-align: center;
    color: #ffffff;
    transition:
      background-color 180ms ease,
      color 180ms ease,
      transform 180ms ease;
  }

  .hero-nav-link:hover {
    transform: translateY(-1px);
    background-color: #fcd95a;
    color: #1b2e4c;
  }

  .hero-secondary-button {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    padding: 0 26px;
    background-color: #dfded9;
    font-family: Inter, system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    text-align: center;
    color: #7d7f83;
    transition:
      background-color 180ms ease,
      color 180ms ease,
      transform 180ms ease;
  }

  .hero-secondary-button:hover {
    transform: translateY(-1px);
    background-color: #fcd95a;
    color: #1b2e4c;
  }

  .title{
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 3rem;
    line-height: 1;
    letter-spacing: 0em;
    color: #1b2e4c;
    text-transform: uppercase;
  }

  @media (max-width: 1023px) {
    .hero-secondary-button {
      min-height: 36px;
      padding: 0 16px;
      font-size: 12px;
    }
  }

  .yello-text{
      color: #fcd95a;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      line-height: 1;
      letter-spacing: 0em;
    }

    .yellow-button{
      padding: 24px 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      line-height: 1;
      letter-spacing: 0em;
      color: #1b2e4c;
      background: #fcd95a;
      border-radius: 14px;
    }


  .audience-section {
  padding: 90px 20px 96px;
  background: #ffffff;
}

.audience-title {
  margin: 0 auto 64px;
  text-align: center;
}

.audience-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 42px;
  width: 100%;
  max-width: 1420px;
  margin: 0 auto;
}

.audience-card {
  position: relative;
  min-height: 480px;
  padding: 92px 34px 40px;
  border-radius: 42px;
  background: #ffffff;
  color: #000000;
  text-align: left;
  overflow: hidden;
}

.audience-card__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.audience-card__frame-base {
  fill: none;
  stroke: #cfcfcf;
  stroke-width: 1.2;
}

.audience-card__frame-accent {
  fill: none;
  stroke: #f4c73f;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-dashoffset 80ms linear;
}

/* Верхняя полоса */
.audience-card__frame-accent--top {
  stroke-dasharray: 31 100;
  stroke-dashoffset: var(--line-top-offset);
}

/* Нижняя полоса */
.audience-card__frame-accent--bottom {
  stroke-dasharray: 34 100;
  stroke-dashoffset: var(--line-bottom-offset);
}

.audience-card__icon {
  display: block;
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
  object-fit: contain;
}

.audience-card__title {
  margin: 0 0 28px;
  color: #000000;
  text-align: center;
}

.audience-card__text {
  margin: 0;
  color: #000000;
  text-align: left;
}

.how-section {
  padding: 72px 20px 86px;
  background: #ffffff;
  color: #000000;
}

.how-title {
  margin: 0 auto 56px;
  text-align: center;
}

.how-slider {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  text-align: left;
}

.how-subtitle {
  margin: 0 0 18px;
  color: #000000;
}

.how-card {
  display: grid;
  grid-template-columns: 470px minmax(0, 1fr);
  gap: 56px;
  min-height: 560px;
  padding: 24px 38px 18px 24px;
  border: 4px solid #dddddd;
  border-radius: 42px;
  background: #eeeeee;
  overflow: hidden;
}

.how-left {
  position: relative;
  display: flex;
  min-height: 510px;
  flex-direction: column;
}

.how-tabs {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.how-tab {
  min-width: 108px;
  min-height: 64px;
  border: 0;
  border-radius: 18px;
  background: #1b2e4c;
  color: #ffffff;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
}

.how-tab--active {
  color: #fcd95a;
}

.how-text-card {
  width: 100%;
  min-height: 182px;
  padding: 30px 26px;
  border-radius: 16px;
  background: #1b2e4c;
  color: #ffffff;
}

.how-text-card__title {
  margin: 0 0 16px;
}

.how-text-card__description {
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.how-text-card__description p {
  margin: 0;
}

.how-text-card__list {
  margin: 8px 0 0;
  padding-left: 22px;
  list-style-type: disc;
  list-style-position: outside;
}

.how-text-card__list li {
  display: list-item;
  margin-bottom: 4px;
}

.how-text-card__list li::marker {
  color: #ffffff;
}

.how-arrows {
  display: flex;
  gap: 14px;
  margin-top: auto;
  padding-bottom: 4px;
}

.how-arrow {
  width: 38px;
  height: 38px;
  border: 3px solid #dddddd;
  border-radius: 999px;
  background: #ffffff;
  color: #7d7f83;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.how-image-wrap {
  position: relative;
  min-height: 510px;
  overflow: hidden;
}

.how-image {
  display: block;
  width: 100%;
  height: 510px;
  object-fit: contain;
  object-position: center top;
}

.how-fade-enter-active,
.how-fade-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.how-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.how-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.why-section {
  padding: 78px 20px 92px;
  background: #ffffff;
  color: #000000;
}

.why-title {
  margin: 0 auto 66px;
  text-align: center;
}

.why-layout {
  display: grid;
  grid-template-columns: minmax(0, 520px) 500px;
  gap: 170px;
  align-items: start;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.why-left {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.why-copy {
  color: #000000;
  text-align: left;
}

.why-copy__title {
  max-width: 490px;
  margin: 0 0 18px;
  color: #000000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.why-copy__text {
  max-width: 540px;
  margin: 0;
  color: #000000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0;
}

.why-image-frame {
  position: relative;
  width: 100%;
  min-height: 300px;
  overflow: hidden;
}

.why-image {
  display: block;
  width: 100%;
  height: 300px;
  object-fit: contain;
  object-position: center;
}

.why-card {
  position: relative;
  min-height: 500px;
  padding: 66px 42px 76px;
  border: 4px solid #dddddd;
  border-radius: 42px;
  background: #ffffff;
  color: #000000;
  text-align: left;
}

.why-card__content {
  min-height: 180px;
}

.why-card__title {
  font-size: 1.5rem;
  margin: 0 0 48px;
}

.why-card__text {
  max-width: 360px;
  margin: 0;
  color: #000000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.why-arrows {
  position: absolute;
  right: 28px;
  bottom: 24px;
  display: flex;
  gap: 12px;
}

.why-arrow {
  width: 38px;
  height: 38px;
  border: 3px solid #dddddd;
  border-radius: 999px;
  background: #ffffff;
  color: #7d7f83;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.why-fade-enter-active,
.why-fade-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.why-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.why-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

  @media (max-width: 1280px) {
  .audience-grid {
    gap: 28px;
  }

  .audience-card {
    min-height: 450px;
    padding-right: 28px;
    padding-left: 28px;
  }

  .why-layout {
    grid-template-columns: minmax(0, 480px) 460px;
    gap: 90px;
  }
}

@media (max-width: 1023px) {
  .audience-section {
    padding-top: 72px;
    padding-bottom: 76px;
  }

  .audience-grid {
    grid-template-columns: 1fr;
    max-width: 520px;
    gap: 32px;
  }

  .audience-card {
    min-height: 400px;
  }

  .how-section {
    padding-top: 62px;
    padding-bottom: 68px;
  }

  .how-card {
    grid-template-columns: 1fr;
    gap: 28px;
    min-height: auto;
  }

  .how-left {
    min-height: 340px;
  }

  .how-image-wrap {
    min-height: 380px;
  }

  .how-image {
    height: 380px;
  }

  .why-section {
    padding-top: 64px;
    padding-bottom: 74px;
  }

  .why-title {
    margin-bottom: 42px;
  }

  .why-layout {
    grid-template-columns: 1fr;
    gap: 34px;
    max-width: 560px;
  }

  .why-card {
    min-height: 420px;
  }
}

@media (max-width: 767px) {
  .audience-section {
    padding: 54px 16px 60px;
  }

  .audience-title {
    margin-bottom: 36px;
  }

  .audience-card {
    min-height: 360px;
    padding: 64px 24px 32px;
    border-radius: 30px;
  }

  .audience-card__icon {
    width: 92px;
    height: 92px;
    margin-bottom: 24px;
  }

  .audience-card__title {
    margin-bottom: 22px;
  }

  .how-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .how-title {
    margin-bottom: 38px;
  }

  .how-card {
    padding: 18px;
    border-radius: 28px;
  }

  .how-tabs {
    gap: 8px;
  }

  .how-tab {
    min-width: 0;
    width: 100%;
    min-height: 52px;
    border-radius: 14px;
  }

  .how-text-card {
    padding: 24px 20px;
  }

  .how-image-wrap {
    min-height: 300px;
  }

  .how-image {
    height: 300px;
  }

  .why-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .why-card {
    min-height: 360px;
    padding: 44px 28px 72px;
    border-radius: 30px;
  }

  .why-image-frame {
    min-height: 240px;
    border-radius: 30px;
  }

  .why-image {
    height: 240px;
  }

  .why-copy__title {
    font-size: 22px;
  }

  .why-copy__text {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .audience-card {
    padding-right: 20px;
    padding-left: 20px;
  }

  .how-card {
    padding: 14px;
  }

  .how-tabs {
    flex-direction: column;
  }

  .how-left {
    min-height: 390px;
  }

  .why-card {
    padding-right: 22px;
    padding-left: 22px;
  }

  .why-arrows {
    right: 22px;
  }
}

  .request-section {
    padding: 74px 20px 80px;
    background: #ffffff;
  }

  .request-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 58px;
    width: 100%;
    max-width: 860px;
    min-height: 450px;
    margin: 42px auto 0;
    padding: 34px 32px;
    background: #1b2e4c;
    border-radius: 34px;
    text-align: left;
  }

  .request-info {
    padding-top: 0;
    color: #ffffff;
  }

  .request-info__title {
    margin: 0 0 20px;
    color: #fcd95a;
  }

  .request-info__subtitle {
    margin: 0 0 12px;
    color: #ffffff;
  }

  .request-list {
    margin: 0;
    padding-left: 20px;
    color: #ffffff;
    list-style-type: disc;
    list-style-position: outside;
    text-align: left;
  }

  .request-list li {
    display: list-item;
    margin-bottom: 6px;
  }

  .request-list li::marker {
    color: #ffffff;
  }

  .request-form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .request-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    color: #ffffff;
    text-align: left;
  }

  .request-field span {
    color: #ffffff;
  }

  .request-field input {
    width: 100%;
    min-height: 42px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: #ffffff;
    color: #1b2e4c;
    outline: none;
  }

  .request-field input::placeholder {
    color: #7d7f83;
  }

  .request-submit {
    align-self: center;
    min-width: 230px;
    margin-top: 18px;
    border: 0;
    cursor: pointer;
  }

  .footer-section {
    background: #ffffff;
  }

  .footer-content {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: start;
    width: 100%;
    min-height: 300px;
    padding: 28px 360px 40px;
    background: #1b2e4c;
    border-radius: 18px;
    text-align: left;
  }

  .footer-contacts {
    color: #ffffff;
  }

  .footer-contacts__title {
    margin: 0 0 18px;
    color: #fcd95a;
  }

  .footer-contacts p {
    margin: 0 0 12px;
  }

  .footer-contacts a {
    color: #ffffff;
    text-decoration: none;
  }

  .footer-button {
    grid-column: 2;
    justify-self: center;
    min-width: 300px;
    margin-top: 0;
    text-align: center;
    text-decoration: none;
  }

  /* Адаптив только через @media */
  @media (max-width: 1440px) {
    .footer-content {
      padding-right: 220px;
      padding-left: 220px;
    }
  }

  @media (max-width: 1200px) {
    .footer-content {
      grid-template-columns: 1fr auto;
      padding-right: 120px;
      padding-left: 120px;
    }

    .footer-button {
      grid-column: auto;
    }
  }

  @media (max-width: 1023px) {
    .request-card {
      grid-template-columns: 1fr;
      gap: 32px;
      max-width: 720px;
      min-height: auto;
    }

    .footer-content {
      grid-template-columns: 1fr;
      gap: 32px;
      padding-right: 40px;
      padding-left: 40px;
    }

    .footer-button {
      justify-self: start;
    }
  }

  @media (max-width: 767px) {
    .request-section {
      padding-top: 48px;
      padding-bottom: 56px;
    }

    .title {
      font-size: 2rem;
    }

    .request-card {
      margin-top: 28px;
      padding: 28px 22px;
      border-radius: 24px;
    }

    .request-submit {
      width: 100%;
      min-width: 0;
    }

    .footer-content {
      min-height: auto;
      padding: 28px 22px;
      border-radius: 16px;
    }

    .footer-button {
      width: 100%;
      min-width: 0;
    }
  }

  @media (max-width: 480px) {
    .title {
      font-size: 1.75rem;
    }

    .request-card {
      padding: 24px 18px;
    }
  }
</style>
