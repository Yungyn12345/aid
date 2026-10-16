<script setup lang="ts">
import { localCrossCheckRows, buildComparisonRowsFromDocuments, applyComparisonEdit, isAllowedEmptyComparisonCell } from '#shared/aideclarant/comparison'
import { createEmptyDraft, canonicalDraft, draftValue, updateDraftValue, buildDeclarationDraftFromDocuments, mergeGeneratedDraft, applyComparisonValueToDraft } from '#shared/aideclarant/declaration'
import type { ComparisonCellStatus, ComparisonRow, CrossCheckResult, AnalyzeResult, DeclarationDraft, ExtractedDocuments, AiConnectionState, AiProviderSource, TnvedSuggestion, TnvedSuggestionResult } from '#shared/aideclarant/types'
type AiCrossCheckResponse = CrossCheckResult
type AiAnalyzeResponse = AnalyzeResult & { demoFiles?: Array<{ name: string; extension: string; size: number }> }
type TnvedSuggestionResponse = TnvedSuggestionResult

definePageMeta({
  layout: false,
})

useHead({
  title: 'AI Declarant',
})

type StepNumber = 1 | 2 | 3

type UploadedFileItem = {
  id: string
  name: string
  extension: string
  size: number
  status: 'uploaded' | 'error'
  statusText: string
  file?: File
}

const activeStep = ref<StepNumber>(1)
const fileInputRef = ref<HTMLInputElement | null>(null)

const acceptedExtensions = ['pdf', 'doc', 'docx', 'xlsx']
const acceptedFileInputTypes = '.pdf,.doc,.docx,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const uploadedFiles = ref<UploadedFileItem[]>([])
const isAiProcessing = ref(false)
const aiError = ref('')
const aiSummary = ref('')
const aiSource = ref<AiProviderSource | ''>('')
const aiConnection = ref<AiConnectionState | null>(null)
const extractedDocuments = ref<ExtractedDocuments | null>(null)
const declarationDraft = ref<DeclarationDraft | null>(null)
const tnvedSuggestions = ref<TnvedSuggestion[]>([])
const tnvedSummary = ref('')
const tnvedSource = ref<AiProviderSource | ''>('')
const tnvedConnection = ref<AiConnectionState | null>(null)
const tnvedError = ref('')
const isTnvedProcessing = ref(false)
const isPdfExportProcessing = ref(false)
const pdfExportError = ref('')

const comparisonColumns = [
  'Контракт',
  'Инвойс',
  'Упаковочный лист',
  'CMR',
]

const comparisonRows = ref<ComparisonRow[]>([])
const isDemo = ref(false)
const demoVersion = ref('')
const selectedGoodsIndex = ref(0)
const generatedDraft = ref<DeclarationDraft>(createEmptyDraft())
const emptyDraft = createEmptyDraft()
const stepItems: StepNumber[] = [1, 2, 3]

const validUploadedFilesCount = computed(() => {
  return uploadedFiles.value.filter((file) => file.status === 'uploaded').length
})

const currentStageTitle = computed(() => {
  if (activeStep.value === 1) {
    return 'ДЕКЛАРАЦИЯ ЗА ПАРУ МИНУТ'
  }

  if (activeStep.value === 2) {
    return 'КРОСС ПРОВЕРКА ДОКУМЕНТОВ'
  }

  return 'ДЕКЛАРАЦИЯ НА ТОВАРЫ (ДТ) ОНЛАЙН ЗАПОЛНЕНИЕ'
})

const currentStageSubtitle = computed(() => {
  if (activeStep.value === 1) {
    return 'ЗАГРУЗИТЕ ВСЕ ДОКУМЕНТЫ В ОДНО ОКНО — МЫ САМИ РАСПРЕДЕЛИМ ИХ ПО КАТЕГОРИЯМ И ПОДГОТОВИМ ДАННЫЕ'
  }

  if (activeStep.value === 2) {
    return 'СВЕРЬТЕ ДАННЫЕ МЕЖДУ ДОКУМЕНТАМИ И УТОЧНИТЕ ЗНАЧЕНИЯ ПЕРЕД ЗАПОЛНЕНИЕМ ДТ'
  }

  return 'ПРОВЕРЬТЕ ПОЛЯ ДЕКЛАРАЦИИ И ЭКСПОРТИРУЙТЕ ГОТОВЫЙ ДОКУМЕНТ'
})

const getFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()
  return extension ? extension.toLowerCase() : ''
}

const isAllowedFile = (file: File) => {
  const extension = getFileExtension(file.name)
  return acceptedExtensions.includes(extension)
}

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} КБ`
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`
}

const shortenFileName = (name: string) => {
  if (name.length <= 16) {
    return name
  }

  const extension = getFileExtension(name)
  const cleanName = extension ? name.replace(`.${extension}`, '') : name

  return `${cleanName.slice(0, 9)}...${extension ? `.${extension}` : ''}`
}

const openFileDialog = () => {
  fileInputRef.value?.click()
}

const addFiles = (fileList: FileList | File[]) => {
  const files = Array.from(fileList)

  files.forEach((file) => {
    const allowed = isAllowedFile(file)
    const extension = getFileExtension(file.name)

    uploadedFiles.value.push({
      id: crypto.randomUUID(),
      name: file.name,
      extension: extension.toUpperCase(),
      size: file.size,
      status: allowed ? 'uploaded' : 'error',
      statusText: allowed ? 'загружен' : 'не загружен: неверный формат',
      file: allowed ? file : undefined,
    })
  })
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  addFiles(input.files)
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  if (!event.dataTransfer?.files.length) {
    return
  }

  addFiles(event.dataTransfer.files)
}

const removeUploadedFile = (id: string) => {
  uploadedFiles.value = uploadedFiles.value.filter((file) => file.id !== id)
}

const goForwardToStep = (step: StepNumber) => {
  if (step <= activeStep.value) {
    return
  }

  activeStep.value = step
}

const selectStep = (step: StepNumber) => {
  if (step >= activeStep.value) {
    return
  }

  activeStep.value = step
}

// Restore the user's session separately from the immutable server demo.
onMounted(() => {
  try {
    const saved = sessionStorage.getItem('aidoc-workspace-v2')
    if (!saved) return
    const state = JSON.parse(saved)
    if (!state.draft || !Array.isArray(state.rows)) return
    declarationDraft.value = canonicalDraft(state.draft)
    generatedDraft.value = canonicalDraft(state.generated || state.draft)
    comparisonRows.value = state.rows
    extractedDocuments.value = state.documents || null
    isDemo.value = state.isDemo === true
    demoVersion.value = state.demoVersion || ''
    aiSummary.value = state.summary || ''
    aiSource.value = state.source || ''
    tnvedSuggestions.value = state.suggestions || []
    tnvedSummary.value = state.tnvedSummary || ''
    uploadedFiles.value = state.files || []
    activeStep.value = [1, 2, 3].includes(state.step) ? state.step : 1
  } catch { /* Ignore a malformed or unavailable browser snapshot. */ }
})
watch([declarationDraft, generatedDraft, comparisonRows, extractedDocuments, isDemo, demoVersion, activeStep, tnvedSuggestions, tnvedSummary], () => {
  if (!import.meta.client || !declarationDraft.value) return
  try {
    sessionStorage.setItem('aidoc-workspace-v2', JSON.stringify({
      draft: declarationDraft.value, generated: generatedDraft.value,
      rows: comparisonRows.value, documents: extractedDocuments.value,
      isDemo: isDemo.value, demoVersion: demoVersion.value, step: activeStep.value,
      summary: aiSummary.value, source: aiSource.value,
      suggestions: tnvedSuggestions.value, tnvedSummary: tnvedSummary.value,
      files: uploadedFiles.value.map(({ file, ...metadata }) => metadata),
    }))
  } catch { /* Storage quota/private mode must not interrupt editing in memory. */ }
}, { deep: true })

const applyAiCrossCheckResult = (response: AiCrossCheckResponse) => {
  comparisonRows.value = response.rows
  aiSummary.value = response.summary
  aiSource.value = response.source
  aiConnection.value = response.aiConnection || aiConnection.value
}

const scheduleAiCrossCheck = () => applyAiCrossCheckResult(localCrossCheckRows(comparisonRows.value))

const runDemoAiAnalysis = async () => {
  isAiProcessing.value = true
  aiError.value = ''
  aiSummary.value = 'Загружаем сохранённую демо-версию...'

  try {
    const response = await $fetch<AiAnalyzeResponse>('/api/aideclarant/demo', {
      method: 'POST',
      body: {
        mode: 'fixed',
      },
    })

    uploadedFiles.value = (response.demoFiles || []).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      extension: file.extension,
      size: file.size,
      status: 'uploaded',
      statusText: 'демо загружен',
    }))

    isDemo.value = true
    demoVersion.value = response.demoVersion || ''
    applyAnalyzePayload(response)

    if (response.errors?.length) {
      aiError.value = response.errors.join('\n')
    }

    goForwardToStep(2)
  } catch (error) {
    aiError.value = error instanceof Error ? error.message : 'Не удалось загрузить демо-документы'
  } finally {
    isAiProcessing.value = false
  }
}

const runUploadedDocumentsAiAnalysis = async () => {
  const validFiles = uploadedFiles.value.filter((file) => file.status === 'uploaded' && file.file)

  if (!validFiles.length) {
    openFileDialog()
    return
  }

  const formData = new FormData()

  validFiles.forEach((file) => {
    if (file.file) {
      formData.append('files', file.file, file.name)
    }
  })

  isDemo.value = false
  demoVersion.value = ''
  isAiProcessing.value = true
  aiError.value = ''
  aiSummary.value = 'ИИ считывает документы и готовит кросс-проверку...'

  try {
    const response = await $fetch<AiAnalyzeResponse>('/api/aideclarant/analyze', {
      method: 'POST',
      body: formData,
    })

    applyAnalyzePayload(response)

    if (response.errors?.length) {
      aiError.value = response.errors.join('\n')
    }

    goForwardToStep(2)
  } catch (error) {
    aiError.value = error instanceof Error ? error.message : 'Не удалось считать документы через ИИ'
  } finally {
    isAiProcessing.value = false
  }
}

const isEmptyComparisonValue = (value: string) => {
  const normalized = value.trim()
  return !normalized || normalized === '—'
}

const getComparisonCellStatus = (row: ComparisonRow, columnIndex: number): ComparisonCellStatus => {
  const storedStatus = row.cellStatuses?.[columnIndex]

  if (storedStatus && storedStatus !== 'unchecked') {
    return storedStatus
  }

  if (isEmptyComparisonValue(row.values[columnIndex] ?? '')) {
    return isAllowedEmptyComparisonCell(row.attribute, columnIndex, row) ? 'ignored' : 'empty'
  }

  return storedStatus || 'unchecked'
}

const uploadInputDocuments = () => {
  void runUploadedDocumentsAiAnalysis()
}

const uploadDemoDocuments = () => {
  void runDemoAiAnalysis()
}

const applyEditedComparisonValue = (row: ComparisonRow, columnIndex: number) => {
  row.preferredColumn = columnIndex
  declarationDraft.value = applyComparisonValueToDraft(declarationDraft.value || createEmptyDraft(), row, row.values[columnIndex] || '')
}
const updateComparisonCell = (rowIndex: number, columnIndex: number, value: string) => {
  const row = comparisonRows.value[rowIndex]
  if (!row) return
  row.values[columnIndex] = value
  extractedDocuments.value = applyComparisonEdit(extractedDocuments.value || {}, row, columnIndex, value)
  const next = buildDeclarationDraftFromDocuments(extractedDocuments.value)
  declarationDraft.value = mergeGeneratedDraft(declarationDraft.value || generatedDraft.value, generatedDraft.value, next)
  generatedDraft.value = next
  applyEditedComparisonValue(row, columnIndex)
  const derived = buildComparisonRowsFromDocuments(extractedDocuments.value)
  comparisonRows.value = comparisonRows.value.map(previous => derived.find(item => item.id === previous.id && item.cellChecks) || previous)
  scheduleAiCrossCheck()
}
const applyDeclarationDraft = (draft?: DeclarationDraft | null) => {
  if (!draft) return
  declarationDraft.value = canonicalDraft(draft)
  generatedDraft.value = canonicalDraft(draft)
}
const getDeclarationFieldValue = (_label: string) => draftValue(declarationDraft.value || emptyDraft, 'g31-desc', selectedGoodsIndex.value)
const setDeclarationFieldValue = (_label: string, value: string) => {
  declarationDraft.value = updateDraftValue(declarationDraft.value || emptyDraft, 'g33-tnved', value, selectedGoodsIndex.value)
}

const applyAnalyzePayload = (response: AiAnalyzeResponse) => {
  extractedDocuments.value = response.documents || null
  applyAiCrossCheckResult(response)
  applyDeclarationDraft(response.declarationDraft)
  tnvedSuggestions.value = response.tnved?.suggestions || []
  tnvedSummary.value = response.tnved?.summary || ''
  tnvedSource.value = response.tnved?.source || ''
  tnvedConnection.value = null
  tnvedError.value = ''
}

const openDeclarationStep = () => {
  declarationDraft.value ||= createEmptyDraft()
  goForwardToStep(3)
}

const requestTnvedSuggestions = async () => {
  isTnvedProcessing.value = true
  tnvedError.value = ''
  tnvedSummary.value = isDemo.value ? 'Загружаем сохранённые рекомендации исходного демо...' : 'ИИ подбирает предварительные коды ТН ВЭД...'

  try {
    const response = await $fetch<TnvedSuggestionResponse>('/api/aideclarant/tnved', {
      method: 'POST',
      body: {
        documents: extractedDocuments.value,
        goodsText: getDeclarationFieldValue('31 Грузовые места и описание товаров'),
        demoVersion: isDemo.value ? demoVersion.value : undefined,
        allowAi: !isDemo.value,
      },
    })

    tnvedSuggestions.value = response.suggestions
    tnvedSummary.value = response.summary
    tnvedSource.value = response.source
    tnvedConnection.value = response.aiConnection || null
  } catch (error) {
    tnvedError.value = error instanceof Error ? error.message : 'Не удалось получить рекомендации по ТН ВЭД'
  } finally {
    isTnvedProcessing.value = false
  }
}

const applyTnvedSuggestion = (suggestion: TnvedSuggestion) => {
  setDeclarationFieldValue('33 ТН ВЭД', suggestion.code)
}

const collectDeclarationDraftFromForm = (): DeclarationDraft => canonicalDraft(declarationDraft.value || emptyDraft)

const exportDeclarationPdf = async () => {
  isPdfExportProcessing.value = true
  pdfExportError.value = ''

  try {
    const draft = collectDeclarationDraftFromForm()
    const response = await fetch('/api/aideclarant/export/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
      },
      body: JSON.stringify({
        declarationDraft: draft,
        filename: 'declaration-ai-doc',
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || 'Не удалось экспортировать декларацию в PDF')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'declaration-ai-doc.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    pdfExportError.value = error instanceof Error ? error.message : 'Не удалось экспортировать декларацию в PDF'
  } finally {
    isPdfExportProcessing.value = false
  }
}

const formatTnvedConfidence = (value: number) => {
  return `${Math.round(value * 100)}%`
}

</script>

<template>
  <main class="declarant-page">
    <NuxtLink to="/" aria-label="AI Doc" class="declarant-logo">
      <img src="/aidoc/logo.svg" alt="AI Doc">
    </NuxtLink>

    <section class="declarant-shell">
      <div class="declarant-head">
        <h1>{{ currentStageTitle }}</h1>
        <p>{{ currentStageSubtitle }}</p>
      </div>

      <div class="declarant-workspace">
        <p v-if="aiError" class="export-error" role="alert">{{ aiError }}</p>
        <Transition name="stage-fade" mode="out-in">
          <section
            v-if="activeStep === 1"
            key="upload"
            class="upload-stage"
          >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              :accept="acceptedFileInputTypes"
              class="upload-input"
              @change="handleFileChange"
            >

            <div
              class="upload-card"
              role="button"
              tabindex="0"
              @click="openFileDialog"
              @keydown.enter.prevent="openFileDialog"
              @keydown.space.prevent="openFileDialog"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <div v-if="!uploadedFiles.length" class="upload-empty">
                <img src="/aideclarant/import.svg" alt="" class="upload-empty__icon">
                <p>Перетащите файлы сюда или нажмите на выбор</p>
                <span>Форматы: PDF, DOC, DOCX, XLSX</span>
              </div>

              <ul v-else class="upload-list">
                <li
                  v-for="file in uploadedFiles"
                  :key="file.id"
                  class="upload-file"
                  :class="{ 'upload-file--error': file.status === 'error' }"
                >
                  <span
                    class="upload-file__status-dot"
                    :class="{ 'upload-file__status-dot--error': file.status === 'error' }"
                    :aria-label="file.status === 'uploaded' ? 'Файл загружен' : 'Файл не загружен'"
                    role="img"
                  >
                    {{ file.status === 'uploaded' ? '✓' : '×' }}
                  </span>

                  <button
                    type="button"
                    class="upload-file__remove"
                    aria-label="Удалить файл"
                    @click.stop="removeUploadedFile(file.id)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 9h10l-.7 11H7.7L7 9Z" />
                    </svg>
                  </button>

                  <img
                    :src="file.status === 'uploaded' ? '/aideclarant/file_yellow.svg' : '/aideclarant/file.svg'"
                    alt=""
                    class="upload-file__icon"
                  >

                  <p class="upload-file__name" :title="file.name">
                    {{ shortenFileName(file.name) }}
                  </p>

                  <span class="upload-file__meta">
                    {{ file.extension }} · {{ formatFileSize(file.size) }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="upload-actions">
              <button type="button" class="yellow-button upload-primary" :disabled="isAiProcessing" @click="uploadInputDocuments">
                {{ isAiProcessing ? 'ИИ СЧИТЫВАЕТ ДОКУМЕНТЫ...' : 'ЗАГРУЗИТЬ ВХОДНЫЕ ДОКУМЕНТЫ' }}
              </button>

              <button type="button" class="yellow-button upload-secondary" :disabled="isAiProcessing" @click="uploadDemoDocuments">
                {{ isAiProcessing ? 'ЗАГРУЖАЕМ ДЕМО...' : 'ЗАГРУЗИТЬ ДЕМО ДОКУМЕНТЫ' }}
              </button>
            </div>
          </section>

          <section
            v-else-if="activeStep === 2"
            key="comparison"
            class="comparison-stage"
          >
            <p class="comparison-guidance">Изменения в таблице автоматически сохраняются в декларации.</p>
            <p v-if="isDemo" class="comparison-guidance">Демо {{ demoVersion }}: исходная выдача зафиксирована; ваши правки действуют только в этой сессии.</p>
            <div class="comparison-table-wrap">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>Атрибут сравнения</th>
                    <th v-for="column in comparisonColumns" :key="column">
                      {{ column }}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, rowIndex) in comparisonRows" :key="row.attribute">
                    <th scope="row">
                      {{ row.attribute }}
                    </th>
                    <td
                      v-for="(_, columnIndex) in comparisonColumns"
                      :key="columnIndex"
                      class="comparison-table__cell"
                      :class="`comparison-table__cell--${getComparisonCellStatus(row, columnIndex)}`"
                    >
                      <textarea
                        :value="row.values[columnIndex] ?? ''"
                        :readonly="!!row.cellChecks || row.id === 'documents.present'"
                        :title="row.cellNotes?.[columnIndex] || ''"
                        :aria-label="`${row.attribute}: ${comparisonColumns[columnIndex]}`"
                        @input="updateComparisonCell(rowIndex, columnIndex, ($event.target as HTMLTextAreaElement).value)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="comparison-guidance">{{ aiSummary }}</p>
            <ul class="comparison-issues"><li v-for="row in comparisonRows.filter(row => row.issue && (row.status === 'mismatch' || row.status === 'empty'))" :key="row.id || row.attribute">{{ row.attribute }}: {{ row.issue }}</li></ul>
            <button type="button" class="yellow-button comparison-next" :disabled="isAiProcessing" @click="openDeclarationStep">
              СФОРМИРОВАТЬ ДЕКЛАРАЦИЮ
            </button>
          </section>

          <section
            v-else
            key="document"
            class="document-stage"
          >
            <DtDeclarationForm :model-value="declarationDraft || emptyDraft" @update:model-value="declarationDraft = $event" />
              <section class="tnved-panel">
                <div class="tnved-panel__head">
                  <div>
                    <h3>Рекомендации по коду ТН ВЭД</h3>
                    <label>Товар <select v-model.number="selectedGoodsIndex"><option v-for="n in Number(declarationDraft?.goodsCount || 1)" :key="n" :value="n - 1">{{ n }}</option></select></label>
                    <p>
                      Отдельное поле с предварительными вариантами. Финальный код должен проверить специалист.
                    </p>
                  </div>

                  <button
                    type="button"
                    class="yellow-button tnved-panel__button"
                    :disabled="isTnvedProcessing"
                    @click="requestTnvedSuggestions"
                  >
                    {{ isTnvedProcessing ? 'ПОДБИРАЕМ КОДЫ...' : isDemo ? 'ПОКАЗАТЬ РЕКОМЕНДАЦИИ ДЕМО' : 'ПРЕДЛОЖИТЬ КОДЫ ТНВЭД' }}
                  </button>
                </div>

                <p v-if="tnvedSummary" class="tnved-panel__summary">
                  {{ tnvedSummary }}
                </p>

                <p v-if="tnvedError" class="tnved-panel__error">
                  {{ tnvedError }}
                </p>

                <div v-if="tnvedSuggestions.length" class="tnved-panel__list">
                  <article
                    v-for="suggestion in tnvedSuggestions"
                    :key="`${suggestion.code}-${suggestion.title}`"
                    class="tnved-card"
                  >
                    <div class="tnved-card__code">
                      {{ suggestion.code }}
                    </div>

                    <div class="tnved-card__body">
                      <h4>{{ suggestion.title }}</h4>
                      <p>{{ suggestion.reason }}</p>
                      <span>Уверенность: {{ formatTnvedConfidence(suggestion.confidence) }}</span>
                    </div>

                    <button
                      type="button"
                      class="tnved-card__apply"
                      @click="applyTnvedSuggestion(suggestion)"
                    >
                      Подставить
                    </button>
                  </article>
                </div>
              </section>

            <button
              type="button"
              class="yellow-button export-button"
              :disabled="isPdfExportProcessing"
              @click="exportDeclarationPdf"
            >
              {{ isPdfExportProcessing ? 'СОБИРАЕМ PDF...' : 'ЭКСПОРТ В PDF' }}
            </button>

            <p v-if="pdfExportError" class="export-error">
              {{ pdfExportError }}
            </p>
          </section>
        </Transition>

        <nav class="stage-nav" aria-label="Этапы оформления декларации">
          <button
            v-for="step in stepItems"
            :key="step"
            type="button"
            class="stage-nav__button"
            :class="{
              'stage-nav__button--active': activeStep === step,
              'stage-nav__button--back': step < activeStep,
            }"
            :disabled="step >= activeStep"
            @click="selectStep(step)"
          >
            {{ step }}
          </button>
        </nav>
      </div>
    </section>

    <footer class="declarant-footer">
      <div class="declarant-footer__content">
        <div>
          <p class="declarant-footer__title">По сотрудничеству:</p>
          <p>TELEGRAM: <a href="https://t.me/YUNGYUNGO_0" target="_blank" rel="noopener noreferrer">@YUNGYUNGO_0</a></p>
          <p>ПОЧТА: <a href="mailto:CHZHEN.YG@DVFU.RU">CHZHEN.YG@DVFU.RU</a></p>
        </div>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.comparison-guidance{font-weight:400;font-size:13px;line-height:1.6;margin:12px 0;color:#e0e0e0;}
.comparison-issues{font-weight:400;font-size:12px;line-height:1.6;max-height:180px;overflow:auto;}

.declarant-page {
  min-height: 100vh;
  padding: 28px 32px 0px;
  background: #1a1a1a;
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.declarant-logo {
  display: inline-flex;
  width: 74px;
  height: 48px;
}

.declarant-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.declarant-shell {
  width: 100%;
  max-width: 1500px;
  margin: 116px auto 0;
}

.declarant-head {
  margin: 0 auto 64px;
  text-align: center;
}

.declarant-head h1 {
  margin: 0;
  font-size: 48px;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
}

.declarant-head p {
  max-width: 760px;
  margin: 24px auto 0;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
}

.declarant-workspace {
  position: relative;
  width: 100%;
  min-height: 420px;
}

.upload-stage,
.comparison-stage,
.document-stage {
  width: 100%;
}

.upload-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-input {
  display: none;
}

.upload-card {
  width: 100%;
  max-width: 980px;
  min-height: 300px;
  padding: 20px;
  border: 24px solid #ffffff;
  border-radius: 38px;
  background: #eeeeee;
  cursor: pointer;
}

.upload-card:focus-visible {
  outline: 3px solid #fcd95a;
  outline-offset: 6px;
}

.upload-empty {
  display: flex;
  min-height: 252px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #8a65ff;
  border-radius: 16px;
  color: #000000;
  text-align: center;
}

.upload-empty__icon {
  width: 42px;
  height: 42px;
  margin-bottom: 18px;
}

.upload-empty p {
  margin: 0;
  font-size: 22px;
}

.upload-empty span {
  margin-top: 10px;
  font-size: 13px;
}

.upload-list {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 12px;
  min-height: 252px;
  margin: 0;
  padding: 18px;
  border: 2px dashed #8a65ff;
  border-radius: 16px;
  list-style: none;
  align-content: start;
}

.upload-file {
  position: relative;
  display: flex;
  aspect-ratio: 1 / 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px 8px;
  border: 1px solid #d6d6d6;
  border-radius: 12px;
  background: #ffffff;
  color: #1b2e4c;
  cursor: default;
}

.upload-file--error {
  border-color: #ff4d4f;
}

.upload-file__icon {
  width: 34px;
  height: 34px;
  margin-bottom: 8px;
}

.upload-file__name {
  width: 100%;
  margin: 0 0 5px;
  overflow: hidden;
  color: #000000;
  font-size: 11px;
  line-height: 1.05;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-file__meta {
  color: #7d7f83;
  font-size: 9px;
  line-height: 1;
  text-align: center;
}

.upload-file__status-dot {
  position: absolute;
  top: -7px;
  right: -7px;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #2bbf6a;
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.upload-file__status-dot--error {
  background: #ff4d4f;
}

.upload-file__remove {
  position: absolute;
  right: -7px;
  bottom: -7px;
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #ff4d4f;
  color: #ffffff;
  cursor: pointer;
}

.upload-file__remove svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
}


.upload-actions {
  display: flex;
  margin-top: 40px;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.yellow-button {
  border: 0;
  cursor: pointer;
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

.upload-primary {
  min-width: 420px;
}

.upload-secondary {
  min-width: 300px;
  padding-top: 16px;
  padding-bottom: 16px;
}

.stage-nav {
  position: absolute;
  top: 70px;
  right: -86px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.stage-nav__button {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #000000;
  cursor: not-allowed;
  font-family: Inter, system-ui, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stage-nav__button--active {
  background: #fcd95a;
}

.stage-nav__button--back {
  cursor: pointer;
}

.comparison-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.comparison-ai-state {
  display: flex;
  width: 100%;
  max-width: 1320px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
  padding: 18px 22px;
  border: 1px solid rgba(252, 217, 90, 0.45);
  border-radius: 16px;
  background: #1b2e4c;
  color: #ffffff;
  text-align: left;
}

.comparison-ai-state p {
  margin: 0 0 8px;
  color: #fcd95a;
}

.comparison-ai-state span {
  display: block;
  margin-top: 4px;
  color: #ffffff;
  font-size: 12px;
  line-height: 1.2;
  white-space: pre-line;
}

.comparison-ai-state--error {
  border-color: #ff4d4f;
}

.comparison-recheck {
  min-width: 210px;
  padding-top: 16px;
  padding-bottom: 16px;
}

.comparison-table-wrap {
  width: 100%;
  max-width: 1320px;
  overflow: auto;
  border-radius: 4px;
  background: #ffffff;
}

.comparison-table {
  width: 100%;
  min-width: 1240px;
  border-collapse: collapse;
  color: #000000;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.25;
  text-align: left;
}

.comparison-table th,
.comparison-table td {
  border: 1px solid #b8b8b8;
  padding: 12px 14px;
  vertical-align: top;
}

.comparison-table thead th {
  background: #f0f0f0;
  font-weight: 700;
  white-space: nowrap;
}

.comparison-table tbody th {
  width: 260px;
  background: #ffffff;
  font-weight: 400;
}

.comparison-table textarea {
  display: block;
  width: 100%;
  min-height: 86px;
  border: 0;
  resize: vertical;
  background: transparent;
  color: #000000;
  font: inherit;
  line-height: 1.25;
  outline: none;
}

.comparison-table__cell--ok {
  background: #e8f8ef;
}

.comparison-table__cell--mismatch,
.comparison-table__cell--empty {
  background: #ffe8e8;
}

.comparison-table__cell--similar,
.comparison-table__cell--unchecked {
  background: #fff8db;
}

.comparison-table__cell--ignored {
  background: #ffffff;
}

.comparison-row-issue {
  display: block;
  margin-top: 8px;
  color: #b42318;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
}

.yellow-button:disabled {
  opacity: 0.68;
  cursor: wait;
}

.comparison-next,
.export-button {
  min-width: 300px;
  margin-top: 32px;
}

.export-error {
  max-width: 760px;
  margin: 14px auto 0;
  color: #ffb4b4;
  font-size: 13px;
  line-height: 1.25;
  text-align: center;
  white-space: pre-line;
}

.document-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.declaration-document {
  width: 100%;
  max-width: 1380px;
  padding: 18px 18px 14px;
  border: 1px solid #111111;
  background: #ffffff;
  color: #000000;
  text-align: left;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 700;
}

.declaration-document__title {
  margin-bottom: 16px;
  border-bottom: 3px solid #0c5fd7;
}

.declaration-document__title h2 {
  margin: 0 0 10px;
  color: #2b2b2b;
  font-size: 17px;
  line-height: 1;
  text-transform: uppercase;
}

.declaration-top-grid {
  display: grid;
  grid-template-columns: 58% 42%;
  gap: 12px;
  align-items: stretch;
}

.declaration-left-column,
.declaration-right-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.declaration-group {
  position: relative;
  border: 1px solid #9f9f9f;
  padding: 10px 10px 12px;
  background: #f7f7f7;
}

.declaration-group + .declaration-group {
  margin-top: 12px;
}

.declaration-left-column .declaration-group + .declaration-group,
.declaration-right-column .declaration-group + .declaration-group {
  margin-top: 0;
}

.declaration-group h3 {
  margin: 0 0 10px;
  color: #2b2b2b;
  font-size: 13px;
  line-height: 1;
}

.declaration-group__fields {
  display: grid;
  grid-template-columns: repeat(var(--declaration-columns), minmax(0, 1fr));
  gap: 8px;
}

.declaration-field {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.declaration-field span {
  color: #333333;
  font-size: 10px;
  line-height: 1.1;
}

.declaration-field input,
.declaration-field textarea {
  width: 100%;
  min-height: 26px;
  border: 1px solid #c8c8c8;
  padding: 6px 8px;
  background: #ffffff;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  outline: none;
}

.declaration-field textarea {
  min-height: 74px;
  resize: vertical;
}

.declaration-group--sender,
.declaration-group--receiver {
  min-height: 132px;
}

.declaration-group--transport {
  min-height: 200px;
}

.declaration-group--general {
  min-height: 230px;
}

.declaration-group--customs {
  min-height: 86px;
}

.declaration-group--goods {
  margin-top: 12px;
}

.declaration-group--goods .declaration-field--textarea:first-child textarea {
  min-height: 168px;
}


.tnved-panel {
  margin-top: 12px;
  border: 1px solid #9f9f9f;
  padding: 12px;
  background: #f7f7f7;
  color: #000000;
  font-family: Arial, Helvetica, sans-serif;
}

.tnved-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tnved-panel h3 {
  margin: 0 0 6px;
  color: #2b2b2b;
  font-size: 13px;
  line-height: 1;
}

.tnved-panel p {
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.25;
}

.tnved-panel__button {
  min-width: 250px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 12px;
}

.tnved-panel__summary,
.tnved-panel__error {
  margin-top: 12px !important;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ffffff;
}

.tnved-panel__summary span {
  display: block;
  margin-top: 5px;
  color: #666666;
}

.tnved-panel__error {
  color: #b42318;
  background: #ffe8e8;
}

.tnved-panel__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 12px;
}

.tnved-card {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid #c8c8c8;
  padding: 10px;
  background: #ffffff;
}

.tnved-card__code {
  border: 1px solid #1b2e4c;
  padding: 8px 10px;
  background: #1b2e4c;
  color: #ffffff;
  font-size: 15px;
  line-height: 1;
  text-align: center;
}

.tnved-card__body h4 {
  margin: 0 0 6px;
  color: #000000;
  font-size: 12px;
  line-height: 1.2;
}

.tnved-card__body p {
  margin: 0 0 5px;
  color: #000000;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.25;
}

.tnved-card__body span {
  color: #666666;
  font-size: 11px;
  font-weight: 400;
}

.tnved-card__apply {
  border: 0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fcd95a;
  color: #1b2e4c;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.declaration-group--payments,
.declaration-group--declarant,
.declaration-group--representative {
  margin-top: 12px;
}

.declaration-group--declarant textarea {
  min-height: 70px;
}

.declaration-group--representative textarea {
  min-height: 72px;
}

.declarant-footer {
  width: 100%;
  max-width: 1500px;
  margin: 64px auto 0;
}

.declarant-footer__content {
  min-height: 170px;
  padding: 28px 260px;
  border-radius: 10px;
  background: #1b2e4c;
  color: #ffffff;
  text-align: left;
}

.declarant-footer__title {
  margin: 0 0 12px;
  color: #fcd95a;
}

.declarant-footer p {
  margin: 0 0 10px;
}

.declarant-footer a {
  color: #ffffff;
  text-decoration: none;
}

.stage-fade-enter-active,
.stage-fade-leave-active {
  transition: opacity 220ms ease;
}

.stage-fade-enter-from,
.stage-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1440px) {
  .declarant-shell {
    max-width: 1240px;
  }

  .stage-nav {
    right: -70px;
  }

  .declarant-footer {
    max-width: 1240px;
  }

  .declarant-footer__content {
    padding-right: 220px;
    padding-left: 220px;
  }
}

@media (max-width: 1280px) {
  .declarant-shell {
    margin-top: 80px;
  }

  .stage-nav {
    position: static;
    margin-top: 32px;
    flex-direction: row;
    justify-content: center;
  }

  .declarant-workspace {
    display: flex;
    flex-direction: column;
  }

  .declarant-footer__content {
    padding-right: 80px;
    padding-left: 80px;
  }
}

@media (max-width: 1023px) {
  .declarant-page {
    padding: 24px 20px 0px;
  }

  .declarant-head h1 {
    font-size: 34px;
  }

  .upload-card {
    border-width: 14px;
  }

  .upload-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .declaration-top-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .declarant-head {
    margin-bottom: 36px;
  }

  .declarant-head h1 {
    font-size: 28px;
  }

  .declarant-head p {
    font-size: 13px;
  }

  .comparison-ai-state {
    flex-direction: column;
    align-items: stretch;
  }

  .upload-primary,
  .upload-secondary,
  .comparison-next,
  .export-button {
    width: 100%;
    min-width: 0;
  }

  .declaration-group__fields {
    grid-template-columns: 1fr;
  }

  .declaration-field {
    grid-column: auto !important;
  }

  .upload-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tnved-panel__head {
    flex-direction: column;
  }

  .tnved-panel__button {
    width: 100%;
  }

  .tnved-card {
    grid-template-columns: 1fr;
  }

  .tnved-card__apply {
    width: 100%;
  }

  .declarant-footer__content {
    padding: 28px 22px;
  }
}
</style>
