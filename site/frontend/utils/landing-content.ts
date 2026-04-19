import type { FaqItem, FeatureItem, FooterLink, MetricItem, StepItem } from '~/types/landing'

export const metrics: MetricItem[] = [
  { value: '24/7', label: 'доступ к сервису и фиксация заявок' },
  { value: '3 шага', label: 'от первого касания до запуска декларации' },
  { value: 'env-ready', label: 'CTA, API и аналитика настраиваются без правки верстки' }
]

export const painPoints: FeatureItem[] = [
  {
    tag: 'Проблема',
    title: 'Ручная подготовка занимает часы',
    description:
      'Команда собирает данные из разных источников, перепроверяет формулировки и тратит время на однотипные операции.'
  },
  {
    tag: 'Риск',
    title: 'Ошибки всплывают слишком поздно',
    description:
      'Нет централизованного сценария, поэтому правки приходят уже перед отправкой документов и влияют на сроки.'
  },
  {
    tag: 'Рост',
    title: 'Сложно масштабировать поток заявок',
    description:
      'Чем больше обращений, тем сильнее проседает скорость обработки и прозрачность статусов для бизнеса.'
  }
]

export const benefits: FeatureItem[] = [
  {
    tag: 'Автоматизация',
    title: 'Единый маршрут для подготовки документов',
    description:
      'Лендинг переводит пользователя в сервис, а backend фиксирует клики, заявки и источники обращений для аналитики.'
  },
  {
    tag: 'Контроль',
    title: 'Отдел продаж видит заявки сразу',
    description:
      'Форма уходит в отдельный API на FastAPI и сохраняется в PostgreSQL, без зависимости от основного продукта.'
  },
  {
    tag: 'SEO',
    title: 'Сайт готов к продвижению',
    description:
      'Nuxt 3, отдельный доменовый маршрут, canonical, sitemap и чистая компонентная структура упрощают дальнейший рост.'
  }
]

export const processSteps: StepItem[] = [
  {
    title: 'Пользователь изучает лендинг',
    description: 'Главная страница объясняет ценность сервиса, показывает сценарий работы и аккуратно ведет к CTA.'
  },
  {
    title: 'Клик по CTA логируется',
    description:
      'Перед переходом на `/aideclarant` фиксируются источник, UTM-метки, referer, target URL и технические атрибуты запроса.'
  },
  {
    title: 'Заявка попадает в отдельный backend',
    description:
      'Если пользователь оставляет контакты, backend валидирует форму, защищает endpoint от спама и сохраняет данные в БД.'
  }
]

export const faqs: FaqItem[] = [
  {
    question: 'Куда ведет кнопка «Заполнить декларацию»?',
    answer:
      'В production адрес задается через env. По умолчанию проект готов к переходу на `https://aiddoc.ru/aideclarant`.'
  },
  {
    question: 'Лендинг зависит от текущего продукта?',
    answer:
      'Нет. Frontend, backend и PostgreSQL для лендинга вынесены отдельно, а продукт за `/aideclarant` подключается через reverse proxy.'
  },
  {
    question: 'Что можно расширить дальше?',
    answer:
      'Добавить CMS-настройки через таблицу `settings`, расширить admin API, подключить дополнительные сценарии аналитики и A/B тесты.'
  }
]

export const footerLinks: FooterLink[] = [
  { label: 'API', href: '#workflow' },
  { label: 'Преимущества', href: '#benefits' },
  { label: 'Заявка', href: '#contact' }
]
