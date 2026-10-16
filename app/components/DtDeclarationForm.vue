<script setup lang="ts">
import { declarationFields } from '#shared/aideclarant/schema'
import { draftValue, updateDraftValue, resizeGoods, removeGoodsAt } from '#shared/aideclarant/declaration'
import type { DeclarationDraft } from '#shared/aideclarant/types'
const props = defineProps<{ modelValue: DeclarationDraft }>()
const emit = defineEmits<{ 'update:modelValue': [value: DeclarationDraft] }>()
const activeInfo = ref('')
const info = computed(() => declarationFields.find(field => field.id === activeInfo.value))
const goodsCount = computed(() => Math.max(1, Number(props.modelValue.goodsCount) || 1))
const goodsIndices = computed(() => Array.from({ length: goodsCount.value }, (_, index) => index))
const inputId = (key: string, index = 0) => `dt-${key}-${index}`
const value = (key: string, index = 0) => draftValue(props.modelValue, key, index)
const isDisabled = (key: string) => declarationFields.some(field => field.controls.some(control => control.key === key && control.disabled)) || (/^g[28]-(name|addr|ogrn|inn)$/.test(key) && props.modelValue[`${key.slice(0, 2)}-same`] === 'true')
const changeValue = (key: string, event: Event, index = 0) => emit('update:modelValue', updateDraftValue(props.modelValue, key, (event.target as HTMLInputElement).value, index))
const changeCheckbox = (key: string, event: Event) => emit('update:modelValue', updateDraftValue(props.modelValue, key, (event.target as HTMLInputElement).checked ? 'true' : 'false'))
const addGoods = () => emit('update:modelValue', resizeGoods(props.modelValue, goodsCount.value + 1))
const removeGoods = (index: number) => emit('update:modelValue', removeGoodsAt(props.modelValue, index))
</script>

<template><div class="dt-prototype"><h2 class="document-title">Декларация на товары</h2>
<div class="board">


  <div class="grid12" id="r1">
    <section class="card col-7">
      <div class="card-head"><h2><span class="head-num">2</span>Отправитель / Экспортёр</h2></div>
      <div class="card-body">
        <div class="chk-row"><input type="checkbox" :id="inputId('g2-same', 0)" data-field="g2-same" aria-label="Отправитель: СМ. ГРАФУ 14 ДТ" :disabled="isDisabled('g2-same')" :checked="value('g2-same') === 'true'" @change="changeCheckbox('g2-same', $event)"> Отметка «СМ. ГРАФУ 14 ДТ»
          </div>

        <div class="chk-row"><input type="checkbox" :id="inputId('g2-contragent', 0)" data-field="g2-contragent" aria-label="Отправитель: КОНТРАГЕНТ" :disabled="isDisabled('g2-contragent')" :checked="value('g2-contragent') === 'true'" @change="changeCheckbox('g2-contragent', $event)"> Отметка «КОНТРАГЕНТ»
          </div>

        <div class="field required" data-field-group="field-1">
          <span class="f-top"><span class="f-name">Наименование организации</span>
            <span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-1'" aria-label="Правило заполнения: Наименование организации">ⓘ</button></span></span>

          <input placeholder="краткое наименование отправителя" :id="inputId('g2-name', 0)" data-field="g2-name" aria-label="Наименование организации — краткое наименование отправителя" :disabled="isDisabled('g2-name')" :value="value('g2-name', 0)" @input="changeValue('g2-name', $event, 0)">
        </div>

        <div class="field required" data-field-group="field-2">
          <span class="f-top"><span class="f-name">Адрес</span>
            <span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-2'" aria-label="Правило заполнения: Адрес">ⓘ</button></span></span>

          <textarea placeholder="страна, индекс, город, улица, дом" :id="inputId('g2-addr', 0)" data-field="g2-addr" aria-label="Адрес — страна, индекс, город, улица, дом" :disabled="isDisabled('g2-addr')" :value="value('g2-addr', 0)" @input="changeValue('g2-addr', $event, 0)"></textarea>
        </div>

        <div class="row">
          <div class="field required" data-field-group="field-3">
            <span class="f-top"><span class="f-name">ОГРН</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-3'" aria-label="Правило заполнения: ОГРН">ⓘ</button></span></span>
            <input class="code" placeholder="ОГРН" :id="inputId('g2-ogrn', 0)" data-field="g2-ogrn" aria-label="ОГРН — ОГРН" :disabled="isDisabled('g2-ogrn')" :value="value('g2-ogrn', 0)" @input="changeValue('g2-ogrn', $event, 0)">
          </div>
          <div class="field required" data-field-group="field-4">
            <span class="f-top"><span class="f-name">ИНН / КПП</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-4'" aria-label="Правило заполнения: ИНН / КПП">ⓘ</button></span></span>
            <input class="code" placeholder="ИНН/КПП" :id="inputId('g2-inn', 0)" data-field="g2-inn" aria-label="ИНН / КПП — ИНН/КПП" :disabled="isDisabled('g2-inn')" :value="value('g2-inn', 0)" @input="changeValue('g2-inn', $event, 0)">
          </div>
        </div>
      </div>
    </section>

    <section class="card col-5">
      <div class="card-head"><h2>Общие сведения о декларации</h2><span class="graphs">гр. 1, 3–7</span></div>
      <div class="card-body">
        <div class="field required" data-field-group="field-5">
          <span class="f-top"><span class="f-badge">1</span><span class="f-name">Декларация</span>
            <span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-5'" aria-label="Правило заполнения: Декларация">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril1" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

          <div class="subrow">
            <input class="code short" placeholder="ИМ/ЭК" :id="inputId('g1-dir', 0)" data-field="g1-dir" aria-label="Декларация — ИМ/ЭК" :disabled="isDisabled('g1-dir')" :value="value('g1-dir', 0)" @input="changeValue('g1-dir', $event, 0)">
            <input class="code short" placeholder="код" :id="inputId('g1-proc', 0)" data-field="g1-proc" aria-label="Декларация — код" :disabled="isDisabled('g1-proc')" :value="value('g1-proc', 0)" @input="changeValue('g1-proc', $event, 0)">
            <input class="code short" placeholder="ЭД" :id="inputId('g1-ed', 0)" data-field="g1-ed" aria-label="Декларация — ЭД" :disabled="isDisabled('g1-ed')" :value="value('g1-ed', 0)" @input="changeValue('g1-ed', $event, 0)">
          </div>
        </div>
        <div class="row">
          <div class="field" data-field-group="field-6">
            <span class="f-top"><span class="f-badge">3</span><span class="f-name">Форма</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-6'" aria-label="Правило заполнения: Форма">ⓘ</button></span></span>

            <div class="subrow"><input class="code short" placeholder="лист" :id="inputId('g3-sheet', 0)" data-field="g3-sheet" aria-label="Форма — лист" :disabled="isDisabled('g3-sheet')" :value="value('g3-sheet', 0)" @input="changeValue('g3-sheet', $event, 0)"><input class="code short" placeholder="всего" :id="inputId('g3-total', 0)" data-field="g3-total" aria-label="Форма — всего" :disabled="isDisabled('g3-total')" :value="value('g3-total', 0)" @input="changeValue('g3-total', $event, 0)"></div>
          </div>
          <div class="field" data-field-group="field-7">
            <span class="f-top"><span class="f-badge">4</span><span class="f-name">Отгрузочные спецификации</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-7'" aria-label="Правило заполнения: Отгрузочные спецификации">ⓘ</button></span></span>
            <input class="code" placeholder="число листов" :id="inputId('g4-lists', 0)" data-field="g4-lists" aria-label="Отгрузочные спецификации — число листов" :disabled="isDisabled('g4-lists')" :value="value('g4-lists', 0)" @input="changeValue('g4-lists', $event, 0)">
          </div>
        </div>
        <div class="row">
          <div class="field required" data-field-group="field-8">
            <span class="f-top"><span class="f-badge">5</span><span class="f-name">Всего товаров</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-8'" aria-label="Правило заполнения: Всего товаров">ⓘ</button></span></span>
            <input placeholder="кол-во" :id="inputId('g5-goods', 0)" data-field="g5-goods" aria-label="Всего товаров — кол-во" :disabled="isDisabled('g5-goods')" :value="value('g5-goods', 0)" @input="changeValue('g5-goods', $event, 0)">
          </div>
          <div class="field required" data-field-group="field-9">
            <span class="f-top"><span class="f-badge">6</span><span class="f-name">Всего мест</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-9'" aria-label="Правило заполнения: Всего мест">ⓘ</button></span></span>
            <input placeholder="кол-во" :id="inputId('g6-pkg', 0)" data-field="g6-pkg" aria-label="Всего мест — кол-во" :disabled="isDisabled('g6-pkg')" :value="value('g6-pkg', 0)" @input="changeValue('g6-pkg', $event, 0)">
          </div>
          <div class="field" data-field-group="field-10">
            <span class="f-top"><span class="f-badge">7</span><span class="f-name">Справочный номер</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-10'" aria-label="Правило заполнения: Справочный номер">ⓘ</button></span></span>
            <input placeholder="номер" :id="inputId('g7-reference', 0)" data-field="g7-reference" aria-label="Справочный номер — номер" :disabled="isDisabled('g7-reference')" :value="value('g7-reference', 0)" @input="changeValue('g7-reference', $event, 0)">
          </div>
        </div>
      </div>
    </section>
  </div>


  <div class="grid12" id="r2">
    <section class="card col-7">
      <div class="card-head"><h2><span class="head-num">8</span>Получатель</h2></div>
      <div class="card-body">
        <div class="chk-row"><input type="checkbox" :id="inputId('g8-same', 0)" data-field="g8-same" aria-label="Получатель: СМ. ГРАФУ 14 ДТ" :disabled="isDisabled('g8-same')" :checked="value('g8-same') === 'true'" @change="changeCheckbox('g8-same', $event)"> Отметка «СМ. ГРАФУ 14 ДТ»
          </div>

        <div class="chk-row"><input type="checkbox" :id="inputId('g8-contragent', 0)" data-field="g8-contragent" aria-label="Получатель: КОНТРАГЕНТ" :disabled="isDisabled('g8-contragent')" :checked="value('g8-contragent') === 'true'" @change="changeCheckbox('g8-contragent', $event)"> Отметка «КОНТРАГЕНТ»
          </div>

        <div class="field required" data-field-group="field-11">
          <span class="f-top"><span class="f-name">Наименование организации</span>
            <span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-11'" aria-label="Правило заполнения: Наименование организации">ⓘ</button></span></span>

          <input placeholder="краткое наименование получателя" :id="inputId('g8-name', 0)" data-field="g8-name" aria-label="Наименование организации — краткое наименование получателя" :disabled="isDisabled('g8-name')" :value="value('g8-name', 0)" @input="changeValue('g8-name', $event, 0)">
        </div>

        <div class="field required" data-field-group="field-12">
          <span class="f-top"><span class="f-name">Адрес</span>
            <span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-12'" aria-label="Правило заполнения: Адрес">ⓘ</button></span></span>

          <textarea placeholder="страна, индекс, город, улица, дом" :id="inputId('g8-addr', 0)" data-field="g8-addr" aria-label="Адрес — страна, индекс, город, улица, дом" :disabled="isDisabled('g8-addr')" :value="value('g8-addr', 0)" @input="changeValue('g8-addr', $event, 0)"></textarea>
        </div>

        <div class="row">
          <div class="field required" data-field-group="field-13">
            <span class="f-top"><span class="f-name">ОГРН</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-13'" aria-label="Правило заполнения: ОГРН">ⓘ</button></span></span>
            <input class="code" placeholder="ОГРН" :id="inputId('g8-ogrn', 0)" data-field="g8-ogrn" aria-label="ОГРН — ОГРН" :disabled="isDisabled('g8-ogrn')" :value="value('g8-ogrn', 0)" @input="changeValue('g8-ogrn', $event, 0)">
          </div>
          <div class="field required" data-field-group="field-14">
            <span class="f-top"><span class="f-name">ИНН / КПП</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-14'" aria-label="Правило заполнения: ИНН / КПП">ⓘ</button></span></span>
            <input class="code" placeholder="ИНН/КПП" :id="inputId('g8-inn', 0)" data-field="g8-inn" aria-label="ИНН / КПП — ИНН/КПП" :disabled="isDisabled('g8-inn')" :value="value('g8-inn', 0)" @input="changeValue('g8-inn', $event, 0)">
          </div>
        </div>
      </div>
    </section>

    <section class="card col-5">
      <div class="card-head"><h2>Финансовые сведения</h2><span class="graphs">гр. 9–13</span></div>
      <div class="card-body">
        <div class="field" data-field-group="field-15">
          <span class="f-top"><span class="f-badge">9</span><span class="f-name">Лицо, ответственное за финансовое урегулирование</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-15'" aria-label="Правило заполнения: Лицо, ответственное за финансовое урегулирование">ⓘ</button></span></span>
          <textarea placeholder="наименование и адрес / СМ. ГРАФУ 14 ДТ" :id="inputId('g9-party', 0)" data-field="g9-party" aria-label="Лицо, ответственное за финансовое урегулирование — наименование и адрес / СМ. ГРАФУ 14 ДТ" :disabled="isDisabled('g9-party')" :value="value('g9-party', 0)" @input="changeValue('g9-party', $event, 0)"></textarea>
        </div>
        <div class="row">
          <div class="field" data-field-group="field-16">
            <span class="f-top"><span class="f-badge">10</span><span class="f-name">Станция 1-го назначения (Ст. 1-го н.)</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-16'" aria-label="Правило заполнения: Станция 1-го назначения (Ст. 1-го н.)">ⓘ</button></span></span>
            <input placeholder="не заполняется" :id="inputId('g10-unused', 0)" data-field="g10-unused" aria-label="Станция 1-го назначения (Ст. 1-го н.) — не заполняется" :disabled="isDisabled('g10-unused')" :value="value('g10-unused', 0)" @input="changeValue('g10-unused', $event, 0)">
          </div>
          <div class="field required" data-field-group="field-17">
            <span class="f-top"><span class="f-badge">11</span><span class="f-name">Торгующая страна</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-17'" aria-label="Правило заполнения: Торгующая страна">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

            <div class="subrow"><input class="code short" placeholder="код" :id="inputId('g11-trade', 0)" data-field="g11-trade" aria-label="Торгующая страна — код" :disabled="isDisabled('g11-trade')" :value="value('g11-trade', 0)" @input="changeValue('g11-trade', $event, 0)"><input class="code" placeholder="не заполняется" :id="inputId('g11-unused', 0)" data-field="g11-unused" aria-label="Торгующая страна — не заполняется" :disabled="isDisabled('g11-unused')" :value="value('g11-unused', 0)" @input="changeValue('g11-unused', $event, 0)"></div>
          </div>
        </div>
        <div class="row">
          <div class="field required" data-field-group="field-18">
            <span class="f-top"><span class="f-badge">12</span><span class="f-name">Общая таможенная стоимость</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-18'" aria-label="Правило заполнения: Общая таможенная стоимость">ⓘ</button></span></span>
            <input placeholder="сумма" :id="inputId('g12-total', 0)" data-field="g12-total" aria-label="Общая таможенная стоимость — сумма" :disabled="isDisabled('g12-total')" :value="value('g12-total', 0)" @input="changeValue('g12-total', $event, 0)">
          </div>
          <div class="field" data-field-group="field-19">
            <span class="f-top"><span class="f-badge">13</span><span class="f-name"></span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-19'" aria-label="Правило заполнения: ">ⓘ</button></span></span>
            <input placeholder="в установленных случаях" :id="inputId('g13-special', 0)" data-field="g13-special" aria-label="в установленных случаях" :disabled="isDisabled('g13-special')" :value="value('g13-special', 0)" @input="changeValue('g13-special', $event, 0)">
          </div>
        </div>
      </div>
    </section>
  </div>


  <div class="grid12" id="r3">
    <section class="card col-7">
      <div class="card-head"><h2><span class="head-num">14</span>Декларант</h2></div>
      <div class="card-body">
        <div class="field required" data-field-group="field-20">
          <span class="f-top"><span class="f-name">Наименование организации</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-20'" aria-label="Правило заполнения: Наименование организации">ⓘ</button></span></span>
          <input placeholder="краткое наименование декларанта" :id="inputId('g14-name', 0)" data-field="g14-name" aria-label="Наименование организации — краткое наименование декларанта" :disabled="isDisabled('g14-name')" :value="value('g14-name', 0)" @input="changeValue('g14-name', $event, 0)">
        </div>
        <div class="field required" data-field-group="field-21">
          <span class="f-top"><span class="f-name">Адрес</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-21'" aria-label="Правило заполнения: Адрес">ⓘ</button></span></span>
          <textarea placeholder="страна, индекс, город, улица, дом" :id="inputId('g14-addr', 0)" data-field="g14-addr" aria-label="Адрес — страна, индекс, город, улица, дом" :disabled="isDisabled('g14-addr')" :value="value('g14-addr', 0)" @input="changeValue('g14-addr', $event, 0)"></textarea>
        </div>
        <div class="row">
          <div class="field required" data-field-group="field-22">
            <span class="f-top"><span class="f-name">ОГРН</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-22'" aria-label="Правило заполнения: ОГРН">ⓘ</button></span></span>
            <input class="code" placeholder="ОГРН" :id="inputId('g14-ogrn', 0)" data-field="g14-ogrn" aria-label="ОГРН — ОГРН" :disabled="isDisabled('g14-ogrn')" :value="value('g14-ogrn', 0)" @input="changeValue('g14-ogrn', $event, 0)">
          </div>
          <div class="field required" data-field-group="field-23">
            <span class="f-top"><span class="f-name">ИНН / КПП</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-23'" aria-label="Правило заполнения: ИНН / КПП">ⓘ</button></span></span>
            <input class="code" placeholder="ИНН/КПП" :id="inputId('g14-inn', 0)" data-field="g14-inn" aria-label="ИНН / КПП — ИНН/КПП" :disabled="isDisabled('g14-inn')" :value="value('g14-inn', 0)" @input="changeValue('g14-inn', $event, 0)">
          </div>
        </div>
      </div>
    </section>

    <section class="card col-5">
      <div class="card-head"><h2>Страны отправления / происхождения / назначения</h2><span class="graphs">гр. 15, 16, 17</span></div>
      <div class="card-body">
        <div class="field required" data-field-group="field-24">
          <span class="f-top"><span class="f-badge">15</span><span class="f-name">Страна отправления</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-24'" aria-label="Правило заполнения: Страна отправления">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

          <div class="subrow"><input placeholder="страна" :id="inputId('g15-name', 0)" data-field="g15-name" aria-label="Страна отправления — страна" :disabled="isDisabled('g15-name')" :value="value('g15-name', 0)" @input="changeValue('g15-name', $event, 0)"><span class="sep">код</span><input class="code short" placeholder="код" :id="inputId('g15-code', 0)" data-field="g15-code" aria-label="Страна отправления — код" :disabled="isDisabled('g15-code')" :value="value('g15-code', 0)" @input="changeValue('g15-code', $event, 0)"></div>
        </div>

        <div class="field required" data-field-group="field-25">
          <span class="f-top"><span class="f-badge">16</span><span class="f-name">Страна происхождения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-25'" aria-label="Правило заполнения: Страна происхождения">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input placeholder="Страна / РАЗНЫЕ / НЕИЗВЕСТНА" :id="inputId('g16-origin', 0)" data-field="g16-origin" aria-label="Страна происхождения — Страна / РАЗНЫЕ / НЕИЗВЕСТНА" :disabled="isDisabled('g16-origin')" :value="value('g16-origin', 0)" @input="changeValue('g16-origin', $event, 0)">
        </div>

        <div class="field required" data-field-group="field-26">
          <span class="f-top"><span class="f-badge">17</span><span class="f-name">Страна назначения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-26'" aria-label="Правило заполнения: Страна назначения">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

          <div class="subrow"><input placeholder="страна" :id="inputId('g17-name', 0)" data-field="g17-name" aria-label="Страна назначения — страна" :disabled="isDisabled('g17-name')" :value="value('g17-name', 0)" @input="changeValue('g17-name', $event, 0)"><span class="sep">код</span><input class="code short" placeholder="код" :id="inputId('g17-code', 0)" data-field="g17-code" aria-label="Страна назначения — код" :disabled="isDisabled('g17-code')" :value="value('g17-code', 0)" @input="changeValue('g17-code', $event, 0)"></div>
        </div>
      </div>
    </section>
  </div>


  <section class="card col-12" id="r4" style="margin-bottom:18px;">
    <div class="card-head"><h2>Транспорт и условия поставки</h2><span class="graphs">гр. 18–30</span></div>
    <div class="card-body">
      <div class="row">
        <div class="field required" data-field-group="field-27">
          <span class="f-top"><span class="f-badge">18</span><span class="f-name">Идентификация и страна регистрации ТС при отправлении/прибытии</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-27'" aria-label="Правило заполнения: Идентификация и страна регистрации ТС при отправлении/прибытии">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input placeholder="номер ТС" :id="inputId('g18-vehicle', 0)" data-field="g18-vehicle" aria-label="Идентификация и страна регистрации ТС при отправлении/прибытии — номер ТС" :disabled="isDisabled('g18-vehicle')" :value="value('g18-vehicle', 0)" @input="changeValue('g18-vehicle', $event, 0)"><input class="code short" placeholder="код страны" :id="inputId('g18-country', 0)" data-field="g18-country" aria-label="Идентификация и страна регистрации ТС при отправлении/прибытии — код страны" :disabled="isDisabled('g18-country')" :value="value('g18-country', 0)" @input="changeValue('g18-country', $event, 0)"></div>
        </div>
        <div class="field required" data-field-group="field-28">
          <span class="f-top"><span class="f-badge">19</span><span class="f-name">Контейнер</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-28'" aria-label="Правило заполнения: Контейнер">ⓘ</button></span></span>
          <input class="code" placeholder="0 или 1" :id="inputId('g19-cont', 0)" data-field="g19-cont" aria-label="Контейнер — 0 или 1" :disabled="isDisabled('g19-cont')" :value="value('g19-cont', 0)" @input="changeValue('g19-cont', $event, 0)">
        </div>
        <div class="field required" data-field-group="field-29">
          <span class="f-top"><span class="f-badge">20</span><span class="f-name">Условия поставки</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-29'" aria-label="Правило заполнения: Условия поставки">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril13" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input class="code short" placeholder="код" :id="inputId('g20-code', 0)" data-field="g20-code" aria-label="Условия поставки — код" :disabled="isDisabled('g20-code')" :value="value('g20-code', 0)" @input="changeValue('g20-code', $event, 0)"><input placeholder="геогр. пункт / РАЗНЫЕ" :id="inputId('g20-place', 0)" data-field="g20-place" aria-label="Условия поставки — геогр. пункт / РАЗНЫЕ" :disabled="isDisabled('g20-place')" :value="value('g20-place', 0)" @input="changeValue('g20-place', $event, 0)"></div>
        </div>
      </div>
      <div class="row">
        <div class="field required" data-field-group="field-30">
          <span class="f-top"><span class="f-badge">21</span><span class="f-name">Идентификация и страна регистрации активного ТС на границе</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-30'" aria-label="Правило заполнения: Идентификация и страна регистрации активного ТС на границе">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input placeholder="номер ТС" :id="inputId('g21-vehicle', 0)" data-field="g21-vehicle" aria-label="Идентификация и страна регистрации активного ТС на границе — номер ТС" :disabled="isDisabled('g21-vehicle')" :value="value('g21-vehicle', 0)" @input="changeValue('g21-vehicle', $event, 0)"><input class="code short" placeholder="код страны" :id="inputId('g21-country', 0)" data-field="g21-country" aria-label="Идентификация и страна регистрации активного ТС на границе — код страны" :disabled="isDisabled('g21-country')" :value="value('g21-country', 0)" @input="changeValue('g21-country', $event, 0)"></div>
        </div>
        <div class="field required" data-field-group="field-31">
          <span class="f-top"><span class="f-badge">22</span><span class="f-name">Валюта и общая сумма по счёту</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-31'" aria-label="Правило заполнения: Валюта и общая сумма по счёту">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril23" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input class="code short" placeholder="валюта" :id="inputId('g22-cur', 0)" data-field="g22-cur" aria-label="Валюта и общая сумма по счёту — валюта" :disabled="isDisabled('g22-cur')" :value="value('g22-cur', 0)" @input="changeValue('g22-cur', $event, 0)"><input placeholder="сумма" :id="inputId('g22-sum', 0)" data-field="g22-sum" aria-label="Валюта и общая сумма по счёту — сумма" :disabled="isDisabled('g22-sum')" :value="value('g22-sum', 0)" @input="changeValue('g22-sum', $event, 0)"></div>
        </div>
        <div class="field required" data-field-group="field-32">
          <span class="f-top"><span class="f-badge">23</span><span class="f-name">Курс валюты</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-32'" aria-label="Правило заполнения: Курс валюты">ⓘ</button></span></span>
          <input placeholder="курс" :id="inputId('g23-rate', 0)" data-field="g23-rate" aria-label="Курс валюты — курс" :disabled="isDisabled('g23-rate')" :value="value('g23-rate', 0)" @input="changeValue('g23-rate', $event, 0)">
        </div>
        <div class="field required" data-field-group="field-33">
          <span class="f-top"><span class="f-badge">24</span><span class="f-name">Характер сделки</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-33'" aria-label="Правило заполнения: Характер сделки">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/07pr1003/#a04" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

          <div class="subrow"><input class="code short" placeholder="000" :id="inputId('g24-code', 0)" data-field="g24-code" aria-label="Характер сделки — 000" :disabled="isDisabled('g24-code')" :value="value('g24-code', 0)" @input="changeValue('g24-code', $event, 0)"><input class="code xshort" placeholder="00" :id="inputId('g24-feature', 0)" data-field="g24-feature" aria-label="Характер сделки — 00" :disabled="isDisabled('g24-feature')" :value="value('g24-feature', 0)" @input="changeValue('g24-feature', $event, 0)"><input class="code" placeholder="не заполняется" :id="inputId('g24-unused', 0)" data-field="g24-unused" aria-label="Характер сделки — не заполняется" :disabled="isDisabled('g24-unused')" :value="value('g24-unused', 0)" @input="changeValue('g24-unused', $event, 0)"></div>
        </div>
      </div>
      <div class="row">
        <div class="field required" data-field-group="field-34">
          <span class="f-top"><span class="f-badge">25</span><span class="f-name">Вид транспорта на границе</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-34'" aria-label="Правило заполнения: Вид транспорта на границе">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril3" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="код" :id="inputId('g25-mode', 0)" data-field="g25-mode" aria-label="Вид транспорта на границе — код" :disabled="isDisabled('g25-mode')" :value="value('g25-mode', 0)" @input="changeValue('g25-mode', $event, 0)">
        </div>
        <div class="field" data-field-group="field-35">
          <span class="f-top"><span class="f-badge">26</span><span class="f-name">Вид транспорта внутри страны</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-35'" aria-label="Правило заполнения: Вид транспорта внутри страны">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril3" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="код" :id="inputId('g26-mode', 0)" data-field="g26-mode" aria-label="Вид транспорта внутри страны — код" :disabled="isDisabled('g26-mode')" :value="value('g26-mode', 0)" @input="changeValue('g26-mode', $event, 0)">
        </div>
        <div class="field" data-field-group="field-36">
          <span class="f-top"><span class="f-badge">27</span><span class="f-name">Место погрузки / разгрузки</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-36'" aria-label="Правило заполнения: Место погрузки / разгрузки">ⓘ</button></span></span>
          <input placeholder="не заполняется декларантом" :id="inputId('g27-unused', 0)" data-field="g27-unused" aria-label="Место погрузки / разгрузки — не заполняется декларантом" :disabled="isDisabled('g27-unused')" :value="value('g27-unused', 0)" @input="changeValue('g27-unused', $event, 0)">
        </div>
        <div class="field" data-field-group="field-37">
          <span class="f-top"><span class="f-badge">28</span><span class="f-name">Финансовые и банковские сведения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-37'" aria-label="Правило заполнения: Финансовые и банковские сведения">ⓘ</button></span></span>
          <input placeholder="не заполняется декларантом" :id="inputId('g28-unused', 0)" data-field="g28-unused" aria-label="Финансовые и банковские сведения — не заполняется декларантом" :disabled="isDisabled('g28-unused')" :value="value('g28-unused', 0)" @input="changeValue('g28-unused', $event, 0)">
        </div>
      </div>
      <div class="row">
        <div class="field required" data-field-group="field-38">
          <span class="f-top"><span class="f-badge">29</span><span class="f-name">Орган въезда / выезда</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-38'" aria-label="Правило заполнения: Орган въезда / выезда">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tam/" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="код таможенного поста" :id="inputId('g29-office', 0)" data-field="g29-office" aria-label="Орган въезда / выезда — код таможенного поста" :disabled="isDisabled('g29-office')" :value="value('g29-office', 0)" @input="changeValue('g29-office', $event, 0)">
        </div>
        <div class="field required" data-field-group="field-39">
          <span class="f-top"><span class="f-badge">30</span><span class="f-name">Местонахождение товаров</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-39'" aria-label="Правило заполнения: Местонахождение товаров">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril24" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input placeholder="код места / адрес" :id="inputId('g30-location', 0)" data-field="g30-location" aria-label="Местонахождение товаров — код места / адрес" :disabled="isDisabled('g30-location')" :value="value('g30-location', 0)" @input="changeValue('g30-location', $event, 0)">
        </div>
      </div>
    </div>
  </section>


  <section v-for="goodsIndex in goodsIndices" :key="goodsIndex" class="card col-12" style="margin-bottom:18px;" :id="'r5-' + goodsIndex">
    <div class="card-head"><h2>Товары <span v-if="goodsCount > 1">{{ goodsIndex + 1 }}</span></h2><span class="graphs">гр. 31–48, B</span></div>
    <div class="goods-actions"><button type="button" @click="addGoods">Добавить товар</button><button v-if="goodsCount > 1" type="button" @click="removeGoods(goodsIndex)">Удалить этот товар</button></div><div class="card-body">
      <div class="field required" data-field-group="field-40">
        <span class="f-top"><span class="f-badge">31</span><span class="f-name">Грузовые места и описание товаров</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-40'" aria-label="Правило заполнения: Грузовые места и описание товаров">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril12" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
        <textarea placeholder="маркировка, кол-во и вид мест, описание товара" :id="inputId('g31-desc', goodsIndex)" data-field="g31-desc" :data-goods-index="goodsIndex" aria-label="Грузовые места и описание товаров — маркировка, кол-во и вид мест, описание товара" :disabled="isDisabled('g31-desc')" :value="value('g31-desc', goodsIndex)" @input="changeValue('g31-desc', $event, goodsIndex)"></textarea>
      </div>

      <div class="row">
        <div class="field required" data-field-group="field-41">
          <span class="f-top"><span class="f-badge">32</span><span class="f-name">Товар №</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-41'" aria-label="Правило заполнения: Товар №">ⓘ</button></span></span>
          <input class="code" placeholder="1" :id="inputId('g32-num', goodsIndex)" data-field="g32-num" :data-goods-index="goodsIndex" aria-label="Товар № — 1" :disabled="isDisabled('g32-num')" :value="value('g32-num', goodsIndex)" @input="changeValue('g32-num', $event, goodsIndex)">
        </div>
        <div class="field required" data-field-group="field-42">
          <span class="f-top"><span class="f-badge">33</span><span class="f-name">Код товара</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-42'" aria-label="Правило заполнения: Код товара">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tnved/" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

          <div class="subrow"><input class="code" placeholder="10 знаков ТН ВЭД" :id="inputId('g33-tnved', goodsIndex)" data-field="g33-tnved" :data-goods-index="goodsIndex" aria-label="Код товара — 10 знаков ТН ВЭД" :disabled="isDisabled('g33-tnved')" :value="value('g33-tnved', goodsIndex)" @input="changeValue('g33-tnved', $event, goodsIndex)"><input class="code xshort" placeholder="М/О" :id="inputId('g33-intellectual', goodsIndex)" data-field="g33-intellectual" :data-goods-index="goodsIndex" aria-label="Код товара — М/О" :disabled="isDisabled('g33-intellectual')" :value="value('g33-intellectual', goodsIndex)" @input="changeValue('g33-intellectual', $event, goodsIndex)"><input class="code short" placeholder="0000" :id="inputId('g33-additional', goodsIndex)" data-field="g33-additional" :data-goods-index="goodsIndex" aria-label="Код товара — 0000" :disabled="isDisabled('g33-additional')" :value="value('g33-additional', goodsIndex)" @input="changeValue('g33-additional', $event, goodsIndex)"></div>
        </div>
        <div class="field required" data-field-group="field-43">
          <span class="f-top"><span class="f-badge">34</span><span class="f-name">Код страны происхождения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-43'" aria-label="Правило заполнения: Код страны происхождения">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril22" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="код страны" :id="inputId('g34-origin', goodsIndex)" data-field="g34-origin" :data-goods-index="goodsIndex" aria-label="Код страны происхождения — код страны" :disabled="isDisabled('g34-origin')" :value="value('g34-origin', goodsIndex)" @input="changeValue('g34-origin', $event, goodsIndex)">
        </div>
        <div class="field required" data-field-group="field-44">
          <span class="f-top"><span class="f-badge">35</span><span class="f-name">Вес брутто (кг)</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-44'" aria-label="Правило заполнения: Вес брутто (кг)">ⓘ</button></span></span>
          <input placeholder="кг" :id="inputId('g35-gross', goodsIndex)" data-field="g35-gross" :data-goods-index="goodsIndex" aria-label="Вес брутто (кг) — кг" :disabled="isDisabled('g35-gross')" :value="value('g35-gross', goodsIndex)" @input="changeValue('g35-gross', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-45">
          <span class="f-top"><span class="f-badge">36</span><span class="f-name">Преференция</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-45'" aria-label="Правило заполнения: Преференция">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril7" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="код льготы" :id="inputId('g36-preference', goodsIndex)" data-field="g36-preference" :data-goods-index="goodsIndex" aria-label="Преференция — код льготы" :disabled="isDisabled('g36-preference')" :value="value('g36-preference', goodsIndex)" @input="changeValue('g36-preference', $event, goodsIndex)">
        </div>
        <div class="field required" data-field-group="field-46">
          <span class="f-top"><span class="f-badge">37</span><span class="f-name">Процедура</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-46'" aria-label="Правило заполнения: Процедура">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril1" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input class="code short" placeholder="00/00" :id="inputId('g37-procedure', goodsIndex)" data-field="g37-procedure" :data-goods-index="goodsIndex" aria-label="Процедура — 00/00" :disabled="isDisabled('g37-procedure')" :value="value('g37-procedure', goodsIndex)" @input="changeValue('g37-procedure', $event, goodsIndex)"><input class="code short" placeholder="000" :id="inputId('g37-movement', goodsIndex)" data-field="g37-movement" :data-goods-index="goodsIndex" aria-label="Процедура — 000" :disabled="isDisabled('g37-movement')" :value="value('g37-movement', goodsIndex)" @input="changeValue('g37-movement', $event, goodsIndex)"></div>
        </div>
        <div class="field required" data-field-group="field-47">
          <span class="f-top"><span class="f-badge">38</span><span class="f-name">Вес нетто (кг)</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-47'" aria-label="Правило заполнения: Вес нетто (кг)">ⓘ</button></span></span>
          <input placeholder="кг" :id="inputId('g38-net', goodsIndex)" data-field="g38-net" :data-goods-index="goodsIndex" aria-label="Вес нетто (кг) — кг" :disabled="isDisabled('g38-net')" :value="value('g38-net', goodsIndex)" @input="changeValue('g38-net', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-48">
          <span class="f-top"><span class="f-badge">39</span><span class="f-name">Квота</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-48'" aria-label="Правило заполнения: Квота">ⓘ</button></span></span>
          <input placeholder="если применимо" :id="inputId('g39-quota', goodsIndex)" data-field="g39-quota" :data-goods-index="goodsIndex" aria-label="Квота — если применимо" :disabled="isDisabled('g39-quota')" :value="value('g39-quota', goodsIndex)" @input="changeValue('g39-quota', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-49">
          <span class="f-top"><span class="f-badge">40</span><span class="f-name">Общая декларация / предшествующий документ</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-49'" aria-label="Правило заполнения: Общая декларация / предшествующий документ">ⓘ</button></span></span>
          <input placeholder="№ документа" :id="inputId('g40-previous', goodsIndex)" data-field="g40-previous" :data-goods-index="goodsIndex" aria-label="Общая декларация / предшествующий документ — № документа" :disabled="isDisabled('g40-previous')" :value="value('g40-previous', goodsIndex)" @input="changeValue('g40-previous', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-50">
          <span class="f-top"><span class="f-badge">41</span><span class="f-name">Доп. единица измерения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-50'" aria-label="Правило заполнения: Доп. единица измерения">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril15" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <div class="subrow"><input class="code short" placeholder="ед." :id="inputId('g41-unit', goodsIndex)" data-field="g41-unit" :data-goods-index="goodsIndex" aria-label="Доп. единица измерения — ед." :disabled="isDisabled('g41-unit')" :value="value('g41-unit', goodsIndex)" @input="changeValue('g41-unit', $event, goodsIndex)"><input placeholder="кол-во" :id="inputId('g41-quantity', goodsIndex)" data-field="g41-quantity" :data-goods-index="goodsIndex" aria-label="Доп. единица измерения — кол-во" :disabled="isDisabled('g41-quantity')" :value="value('g41-quantity', goodsIndex)" @input="changeValue('g41-quantity', $event, goodsIndex)"></div>
        </div>
        <div class="field required" data-field-group="field-51">
          <span class="f-top"><span class="f-badge">42</span><span class="f-name">Цена товара</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-51'" aria-label="Правило заполнения: Цена товара">ⓘ</button></span></span>
          <input placeholder="цена по счёту" :id="inputId('g42-amount', goodsIndex)" data-field="g42-amount" :data-goods-index="goodsIndex" aria-label="Цена товара — цена по счёту" :disabled="isDisabled('g42-amount')" :value="value('g42-amount', goodsIndex)" @input="changeValue('g42-amount', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-52">
          <span class="f-top"><span class="f-badge">43</span><span class="f-name">Код МОС</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-52'" aria-label="Правило заполнения: Код МОС">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril4" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input class="code" placeholder="метод 1–6" :id="inputId('g43-method', goodsIndex)" data-field="g43-method" :data-goods-index="goodsIndex" aria-label="Код МОС — метод 1–6" :disabled="isDisabled('g43-method')" :value="value('g43-method', goodsIndex)" @input="changeValue('g43-method', $event, goodsIndex)">
        </div>
      </div>



      <div class="field required" data-field-group="field-53">
        <span class="f-top"><span class="f-badge">44</span><span class="f-name">Дополнительная информация / представленные документы</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-53'" aria-label="Правило заполнения: Дополнительная информация / представленные документы">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril8" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
        <textarea placeholder="список документов (код, номер, дата) — заполняется автоматически" :id="inputId('g44-documents', goodsIndex)" data-field="g44-documents" :data-goods-index="goodsIndex" aria-label="Дополнительная информация / представленные документы — список документов (код, номер, дата) — заполняется автоматически" :disabled="isDisabled('g44-documents')" :value="value('g44-documents', goodsIndex)" @input="changeValue('g44-documents', $event, goodsIndex)"></textarea>
      </div>
<slot v-if="goodsIndex === 0" name="tnved" />

      <div class="row">
        <div class="field required" data-field-group="field-54">
          <span class="f-top"><span class="f-badge">45</span><span class="f-name">Таможенная стоимость</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-54'" aria-label="Правило заполнения: Таможенная стоимость">ⓘ</button></span></span>
          <input placeholder="расчёт" :id="inputId('g45-cval', goodsIndex)" data-field="g45-cval" :data-goods-index="goodsIndex" aria-label="Таможенная стоимость — расчёт" :disabled="isDisabled('g45-cval')" :value="value('g45-cval', goodsIndex)" @input="changeValue('g45-cval', $event, goodsIndex)">
        </div>
        <div class="field required" data-field-group="field-55">
          <span class="f-top"><span class="f-badge">46</span><span class="f-name">Статистическая стоимость</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-55'" aria-label="Правило заполнения: Статистическая стоимость">ⓘ</button></span></span>
          <input placeholder="расчёт" :id="inputId('g46-statistical', goodsIndex)" data-field="g46-statistical" :data-goods-index="goodsIndex" aria-label="Статистическая стоимость — расчёт" :disabled="isDisabled('g46-statistical')" :value="value('g46-statistical', goodsIndex)" @input="changeValue('g46-statistical', $event, goodsIndex)">
        </div>
        <div class="field" data-field-group="field-56">
          <span class="f-top"><span class="f-badge">48</span><span class="f-name">Отсрочка платежей</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-56'" aria-label="Правило заполнения: Отсрочка платежей">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril10" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
          <input placeholder="код и срок, если применяется" :id="inputId('g48-deferral', goodsIndex)" data-field="g48-deferral" :data-goods-index="goodsIndex" aria-label="Отсрочка платежей — код и срок, если применяется" :disabled="isDisabled('g48-deferral')" :value="value('g48-deferral', goodsIndex)" @input="changeValue('g48-deferral', $event, goodsIndex)">
        </div>
      </div>

      <div class="field" data-field-group="field-57">
        <span class="f-top"><span class="f-badge">47</span><span class="f-name">Исчисление платежей</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-57'" aria-label="Правило заполнения: Исчисление платежей">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril9" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
        <textarea placeholder="вид / основа начисления / ставка / сумма / СП — рассчитывается автоматически" :id="inputId('g47-payments', goodsIndex)" data-field="g47-payments" :data-goods-index="goodsIndex" aria-label="Исчисление платежей — вид / основа начисления / ставка / сумма / СП — рассчитывается автоматически" :disabled="isDisabled('g47-payments')" :value="value('g47-payments', goodsIndex)" @input="changeValue('g47-payments', $event, goodsIndex)"></textarea>
      </div>

      <div class="field" data-field-group="field-58" v-if="goodsIndex === 0">
        <span class="f-top"><span class="f-badge">B</span><span class="f-name">Подробности подсчёта</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-58'" aria-label="Правило заполнения: Подробности подсчёта">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril9" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>
        <textarea class="code" placeholder="код платежа–сумма–код валюты–№ документа–дата–способ уплаты–налоговый номер (каждый вид платежа с новой строки)" :id="inputId('gB-payments', 0)" data-field="gB-payments" aria-label="Подробности подсчёта — код платежа–сумма–код валюты–№ документа–дата–способ уплаты–налоговый номер (каждый вид платежа с новой строки)" :disabled="isDisabled('gB-payments')" :value="value('gB-payments', 0)" @input="changeValue('gB-payments', $event, 0)"></textarea>
      </div>
    </div>
  </section>


  <section class="card col-12 foot-block" id="r6" style="margin-bottom:18px;">
    <div class="card-head"><h2>Служебная информация</h2><span class="graphs">гр. 49, 51, 53</span></div>
    <div class="card-body">

      <div class="row">
        <div class="field" data-field-group="field-59">
          <span class="f-top"><span class="f-badge">49</span><span class="f-name">Реквизиты склада</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-59'" aria-label="Правило заполнения: Реквизиты склада">ⓘ</button></span></span>
          <input placeholder="код и наименование склада" :id="inputId('g49-warehouse', 0)" data-field="g49-warehouse" aria-label="Реквизиты склада — код и наименование склада" :disabled="isDisabled('g49-warehouse')" :value="value('g49-warehouse', 0)" @input="changeValue('g49-warehouse', $event, 0)">
        </div>
        <div class="field" data-field-group="field-60">
          <span class="f-top"><span class="f-badge">51</span><span class="f-name">Предполагаемые органы (и страна) транзита</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-60'" aria-label="Правило заполнения: Предполагаемые органы (и страна) транзита">ⓘ</button></span></span>
          <input placeholder="только для транзита" :id="inputId('g51-transit', 0)" data-field="g51-transit" aria-label="Предполагаемые органы (и страна) транзита — только для транзита" :disabled="isDisabled('g51-transit')" :value="value('g51-transit', 0)" @input="changeValue('g51-transit', $event, 0)">
        </div>
        <div class="field" data-field-group="field-61">
          <span class="f-top"><span class="f-badge">53</span><span class="f-name">Орган (и страна) назначения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-61'" aria-label="Правило заполнения: Орган (и страна) назначения">ⓘ</button></span></span>
          <input placeholder="только для транзита" :id="inputId('g53-destination', 0)" data-field="g53-destination" aria-label="Орган (и страна) назначения — только для транзита" :disabled="isDisabled('g53-destination')" :value="value('g53-destination', 0)" @input="changeValue('g53-destination', $event, 0)">
        </div>
      </div>
    </div>
  </section>


  <section class="card col-12" id="r7">
    <div class="card-head"><h2><span class="head-num">54</span>Место и дата · сведения о декларанте и таможенном представителе</h2></div>
    <div class="card-body">
      <div class="g54">
        <div>
          <div class="sub54">
            <div class="sub54-num">1</div>
            <div class="sub54-body">
              <div class="row">
                <div class="field" data-field-group="field-62">
                  <span class="f-top"><span class="f-name">Св-во таможенного представителя</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-62'" aria-label="Правило заполнения: Св-во таможенного представителя">ⓘ</button></span></span>

                  <div class="subrow"><input placeholder="Номер" :id="inputId('g54-certificate-number', 0)" data-field="g54-certificate-number" aria-label="Св-во таможенного представителя — Номер" :disabled="isDisabled('g54-certificate-number')" :value="value('g54-certificate-number', 0)" @input="changeValue('g54-certificate-number', $event, 0)"><input class="code short" placeholder="Дата" :id="inputId('g54-certificate-date', 0)" data-field="g54-certificate-date" aria-label="Св-во таможенного представителя — Дата" :disabled="isDisabled('g54-certificate-date')" :value="value('g54-certificate-date', 0)" @input="changeValue('g54-certificate-date', $event, 0)"></div>
                </div>
                <div class="field" data-field-group="field-63">
                  <span class="f-top"><span class="f-name">ИНН / КПП там. представителя</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-63'" aria-label="Правило заполнения: ИНН / КПП там. представителя">ⓘ</button></span></span>
                  <input class="code" placeholder="ИНН/КПП" :id="inputId('g54-inn', 0)" data-field="g54-inn" aria-label="ИНН / КПП там. представителя — ИНН/КПП" :disabled="isDisabled('g54-inn')" :value="value('g54-inn', 0)" @input="changeValue('g54-inn', $event, 0)">
                </div>
              </div>
              <div class="field" data-field-group="field-64">
                <span class="f-top"><span class="f-name">Договор таможенного представителя с клиентом</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-64'" aria-label="Правило заполнения: Договор таможенного представителя с клиентом">ⓘ</button></span></span>

                <div class="subrow"><input placeholder="Номер" :id="inputId('g54-contract-number', 0)" data-field="g54-contract-number" aria-label="Договор таможенного представителя с клиентом — Номер" :disabled="isDisabled('g54-contract-number')" :value="value('g54-contract-number', 0)" @input="changeValue('g54-contract-number', $event, 0)"><input class="code short" placeholder="Дата" :id="inputId('g54-contract-date', 0)" data-field="g54-contract-date" aria-label="Договор таможенного представителя с клиентом — Дата" :disabled="isDisabled('g54-contract-date')" :value="value('g54-contract-date', 0)" @input="changeValue('g54-contract-date', $event, 0)"></div>
              </div>
            </div>
          </div>

          <div class="sub54">
            <div class="sub54-num">2</div>
            <div class="sub54-body">
              <div class="field required" data-field-group="field-65">
                <span class="f-top"><span class="f-name">Декларант</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-65'" aria-label="Правило заполнения: Декларант">ⓘ</button></span></span>

                <div class="subrow"><input placeholder="Фамилия" :id="inputId('g54-surname', 0)" data-field="g54-surname" aria-label="Декларант — Фамилия" :disabled="isDisabled('g54-surname')" :value="value('g54-surname', 0)" @input="changeValue('g54-surname', $event, 0)"><input placeholder="Имя" :id="inputId('g54-firstname', 0)" data-field="g54-firstname" aria-label="Декларант — Имя" :disabled="isDisabled('g54-firstname')" :value="value('g54-firstname', 0)" @input="changeValue('g54-firstname', $event, 0)"><input placeholder="Отчество" :id="inputId('g54-patronymic', 0)" data-field="g54-patronymic" aria-label="Декларант — Отчество" :disabled="isDisabled('g54-patronymic')" :value="value('g54-patronymic', 0)" @input="changeValue('g54-patronymic', $event, 0)"></div>
              </div>
              <div class="row">
                <div class="field" data-field-group="field-66">
                  <span class="f-top"><span class="f-name">Телефон</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-66'" aria-label="Правило заполнения: Телефон">ⓘ</button></span></span>
                  <input placeholder="телефон" :id="inputId('g54-phone', 0)" data-field="g54-phone" aria-label="Телефон — телефон" :disabled="isDisabled('g54-phone')" :value="value('g54-phone', 0)" @input="changeValue('g54-phone', $event, 0)">
                </div>
                <div class="field" data-field-group="field-67">
                  <span class="f-top"><span class="f-name">Должность</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-67'" aria-label="Правило заполнения: Должность">ⓘ</button></span></span>
                  <input placeholder="должность" :id="inputId('g54-position', 0)" data-field="g54-position" aria-label="Должность — должность" :disabled="isDisabled('g54-position')" :value="value('g54-position', 0)" @input="changeValue('g54-position', $event, 0)">
                </div>
              </div>
              <div class="field required" data-field-group="field-68">
                <span class="f-top"><span class="f-name">Документ, удостоверяющий личность</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-68'" aria-label="Правило заполнения: Документ, удостоверяющий личность">ⓘ</button><a class="f-btn link" target="_blank" href="https://www.alta.ru/tamdoc/10sr0378/#pril8" rel="noopener noreferrer" aria-label="Открыть классификатор">⌘</a></span></span>

                <div class="subrow"><input class="code xshort" placeholder="Код" :id="inputId('g54-identity-code', 0)" data-field="g54-identity-code" aria-label="Документ, удостоверяющий личность — Код" :disabled="isDisabled('g54-identity-code')" :value="value('g54-identity-code', 0)" @input="changeValue('g54-identity-code', $event, 0)"><input placeholder="Краткое наим." :id="inputId('g54-identity-name', 0)" data-field="g54-identity-name" aria-label="Документ, удостоверяющий личность — Краткое наим." :disabled="isDisabled('g54-identity-name')" :value="value('g54-identity-name', 0)" @input="changeValue('g54-identity-name', $event, 0)"><input class="code xshort" placeholder="Серия" :id="inputId('g54-identity-series', 0)" data-field="g54-identity-series" aria-label="Документ, удостоверяющий личность — Серия" :disabled="isDisabled('g54-identity-series')" :value="value('g54-identity-series', 0)" @input="changeValue('g54-identity-series', $event, 0)"><input class="code short" placeholder="Номер" :id="inputId('g54-identity-number', 0)" data-field="g54-identity-number" aria-label="Документ, удостоверяющий личность — Номер" :disabled="isDisabled('g54-identity-number')" :value="value('g54-identity-number', 0)" @input="changeValue('g54-identity-number', $event, 0)"><span class="sep">от</span><input class="code short" placeholder="дата" :id="inputId('g54-identity-date', 0)" data-field="g54-identity-date" aria-label="Документ, удостоверяющий личность — дата" :disabled="isDisabled('g54-identity-date')" :value="value('g54-identity-date', 0)" @input="changeValue('g54-identity-date', $event, 0)"></div>
              </div>
              <div class="field required" data-field-group="field-69">
                <span class="f-top"><span class="f-name">Кем выдано удостоверение личности</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-69'" aria-label="Правило заполнения: Кем выдано удостоверение личности">ⓘ</button></span></span>
                <input placeholder="кем выдан" :id="inputId('g54-identity-issuer', 0)" data-field="g54-identity-issuer" aria-label="Кем выдано удостоверение личности — кем выдан" :disabled="isDisabled('g54-identity-issuer')" :value="value('g54-identity-issuer', 0)" @input="changeValue('g54-identity-issuer', $event, 0)">
              </div>
            </div>
          </div>

          <div class="sub54">
            <div class="sub54-num">3</div>
            <div class="sub54-body">
              <div class="field required" data-field-group="field-70">
                <span class="f-top"><span class="f-name">Документ, подтверждающий полномочия декларанта</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-70'" aria-label="Правило заполнения: Документ, подтверждающий полномочия декларанта">ⓘ</button></span></span>

                <div class="subrow"><input placeholder="Наименование" :id="inputId('g54-authority-name', 0)" data-field="g54-authority-name" aria-label="Документ, подтверждающий полномочия декларанта — Наименование" :disabled="isDisabled('g54-authority-name')" :value="value('g54-authority-name', 0)" @input="changeValue('g54-authority-name', $event, 0)"><input class="code short" placeholder="№" :id="inputId('g54-authority-number', 0)" data-field="g54-authority-number" aria-label="Документ, подтверждающий полномочия декларанта — №" :disabled="isDisabled('g54-authority-number')" :value="value('g54-authority-number', 0)" @input="changeValue('g54-authority-number', $event, 0)"><span class="sep">от</span><input class="code short" placeholder="дата" :id="inputId('g54-authority-from', 0)" data-field="g54-authority-from" aria-label="Документ, подтверждающий полномочия декларанта — дата" :disabled="isDisabled('g54-authority-from')" :value="value('g54-authority-from', 0)" @input="changeValue('g54-authority-from', $event, 0)"><span class="sep">до</span><input class="code short" placeholder="дата" :id="inputId('g54-authority-to', 0)" data-field="g54-authority-to" aria-label="Документ, подтверждающий полномочия декларанта — дата" :disabled="isDisabled('g54-authority-to')" :value="value('g54-authority-to', 0)" @input="changeValue('g54-authority-to', $event, 0)"></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="field" data-field-group="field-71">
            <span class="f-top"><span class="f-name">Печатная форма</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-71'" aria-label="Правило заполнения: Печатная форма">ⓘ</button></span></span>

            <textarea rows="12" placeholder="формируется автоматически из полей слева" style="min-height:240px" :id="inputId('g54-print', 0)" data-field="g54-print" aria-label="Печатная форма — формируется автоматически из полей слева" :disabled="isDisabled('g54-print')" :value="value('g54-print', 0)" @input="changeValue('g54-print', $event, 0)" :readonly="true"></textarea>
          </div>
          <div class="row" style="margin-top:12px">
            <div class="field required" data-field-group="field-72">
              <span class="f-top"><span class="f-name">Место заполнения</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-72'" aria-label="Правило заполнения: Место заполнения">ⓘ</button></span></span>
              <input placeholder="город" :id="inputId('g54-place', 0)" data-field="g54-place" aria-label="Место заполнения — город" :disabled="isDisabled('g54-place')" :value="value('g54-place', 0)" @input="changeValue('g54-place', $event, 0)">
            </div>
            <div class="field required" data-field-group="field-73">
              <span class="f-top"><span class="f-name">Дата подачи</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-73'" aria-label="Правило заполнения: Дата подачи">ⓘ</button></span></span>
              <input class="code" placeholder="дд.мм.гггг" :id="inputId('g54-submitted', 0)" data-field="g54-submitted" aria-label="Дата подачи — дд.мм.гггг" :disabled="isDisabled('g54-submitted')" :value="value('g54-submitted', 0)" @input="changeValue('g54-submitted', $event, 0)">
            </div>
            <div class="field" data-field-group="field-74">
              <span class="f-top"><span class="f-name">Дата регистрации</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-74'" aria-label="Правило заполнения: Дата регистрации">ⓘ</button></span></span>
              <input class="code" placeholder="заполняет таможня" :id="inputId('g54-registered', 0)" data-field="g54-registered" aria-label="Дата регистрации — заполняет таможня" :disabled="isDisabled('g54-registered')" :value="value('g54-registered', 0)" @input="changeValue('g54-registered', $event, 0)">
            </div>
          </div>
          <div class="field" style="margin-top:12px" data-field-group="field-75">
            <span class="f-top"><span class="f-name">Номер и дата акта (для отчёта таможенного представителя)</span><span class="f-actions"><button class="f-btn info" type="button" @click="activeInfo = 'field-75'" aria-label="Правило заполнения: Номер и дата акта (для отчёта таможенного представителя)">ⓘ</button></span></span>
            <input placeholder="номер и дата акта" :id="inputId('g54-act', 0)" data-field="g54-act" aria-label="Номер и дата акта (для отчёта таможенного представителя) — номер и дата акта" :disabled="isDisabled('g54-act')" :value="value('g54-act', 0)" @input="changeValue('g54-act', $event, 0)">
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
<div v-if="info" class="info-backdrop" @click.self="activeInfo = ''" @keydown.esc="activeInfo = ''"><section class="info-panel" role="dialog" aria-modal="true" aria-labelledby="dt-info-title"><button class="info-close" type="button" aria-label="Закрыть правило" @click="activeInfo = ''">×</button><h3 id="dt-info-title">Графа {{ info.graph }} · {{ info.label }}</h3><p>{{ info.rule }}</p><p v-if="info.related">{{ info.related }}</p><p v-for="link in info.links" :key="link.url"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a></p></section></div>
</div></template>

<style scoped>

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

  .dt-prototype{
    --bg:#E7EAF0;
    --card:#FBF9F5;
    --card-head:#F3F0E8;
    --ink:#1B2333;
    --muted:#65708A;
    --line:#D9DCE3;
    --accent:#2452C8;
    --accent-ink:#12306B;
    --radius:10px;
    --sans:'Inter',-apple-system,'Segoe UI',sans-serif;
    --mono:'IBM Plex Mono','SFMono-Regular',Consolas,monospace;

    --manual:#C0392B; --manual-bg:#FDEDEA;

    --src-contract:#B0791E; --src-contract-bg:#FBF0D9;
    --src-invoice:#1E8A6E; --src-invoice-bg:#E1F5EE;
    --src-transport:#2D6FE0; --src-transport-bg:#E8F0FE;
    --src-packing:#7C4FC9; --src-packing-bg:#F1EAFB;
    --src-manual:#C0392B; --src-manual-bg:#FDEDEA;
    --src-auto:#57657E; --src-auto-bg:#EEF0F4;
    --src-customs:#20242C; --src-customs-bg:#E9E9EA;
    --src-none:#98A0AF; --src-none-bg:#F2F3F5;
  }

  *{box-sizing:border-box; min-width:0;}
  .dt-prototype{margin:0;font-family:var(--sans);color:var(--ink);background:var(--bg);}

  /* ---------- top bar ---------- */
  .brand{font-weight:700;font-size:15px;}
  .brand small{display:block;font-weight:400;font-size:11.5px;color:#AEBBDE;margin-top:2px;}


  /* ---------- board / grid ---------- */
  .board{max-width:1480px;margin:0 auto;padding:20px 24px 90px;}
  .grid12{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:18px;margin-bottom:18px;align-items:stretch;}
  .col-7{grid-column:span 7;} .col-5{grid-column:span 5;} .col-12{grid-column:span 12;}
  @media (max-width:960px){ .col-7,.col-5{grid-column:span 12;} }

  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;height:100%;}
  .card-head{background:var(--card-head);padding:13px 18px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;}
  .card-head h2{margin:0;font-size:14.5px;font-weight:700;display:flex;align-items:baseline;gap:9px;}
  .head-num{font-family:var(--mono);font-weight:800;font-size:15px;color:var(--ink);}
  .card-head .graphs{font-size:11px;color:var(--muted);font-family:var(--mono);}
  .card-body{padding:16px 18px;display:grid;gap:12px;align-content:start;}

  .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;align-items:stretch;}

  /* ---------- fields (bottom-aligned controls) ---------- */
  .field{position:relative;display:flex;flex-direction:column;border-radius:8px;padding:2px;min-width:0;}
  .f-top{display:flex;align-items:flex-start;gap:8px;flex-wrap:nowrap;min-height:34px;margin-bottom:6px;}
  .f-badge{flex:none;font-family:var(--mono);font-weight:800;font-size:12.5px;color:var(--ink);min-width:22px;line-height:1.35;}
  .f-name{font-size:12px;font-weight:600;color:var(--ink);flex:1;line-height:1.35;}
  .f-actions{display:flex;gap:4px;margin-left:auto;flex:none;}
  .f-btn{width:19px;height:19px;border-radius:5px;border:1px solid var(--line);background:#fff;color:var(--muted);font-size:11px;font-family:var(--mono);cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;flex:none;}
  .f-btn:hover{border-color:var(--accent);color:var(--accent);}
  .f-btn.link{color:var(--accent);text-decoration:none;}

  .field > input, .field > textarea, .field > .subrow{margin-top:auto;}
  .field input,.field textarea{width:100%;font-family:var(--sans);font-size:13px;padding:9px 10px;border-radius:6px;border:1px solid var(--line);background:#fff;color:var(--ink);min-width:0;}
  .field input.code,.field textarea.code{font-family:var(--mono);letter-spacing:.02em;}
  .field textarea{resize:vertical;min-height:52px;line-height:1.45;}
  .field input::placeholder,.field textarea::placeholder{color:#B7BECC;}
  .field.required input,.field.required textarea{border-color:var(--manual);background:var(--manual-bg);}
  .field.required input::placeholder,.field.required textarea::placeholder{color:#D08B82;}
  .field input:disabled,.field textarea:disabled{background:#F1F2F4;color:#9AA2B1;cursor:not-allowed;}

  .subrow{display:flex;gap:6px;flex-wrap:wrap;}
  .subrow input{flex:1 1 110px;min-width:64px;}
  .subrow input.short{flex:0 0 58px;min-width:52px;text-align:center;}
  .subrow input.xshort{flex:0 0 48px;min-width:44px;text-align:center;}
  .subrow .sep{color:var(--muted);font-size:12px;align-self:center;flex:none;}



  /* ---------- checkbox rows ---------- */
  .chk-row{display:flex;align-items:flex-start;gap:9px;font-size:12px;color:var(--ink);font-weight:600;padding:9px 11px;background:#fff;border:1px solid var(--line);border-radius:7px;line-height:1.4;}
  .chk-row input{width:auto;flex:none;margin-top:1px;}
  .chk-row .why{display:block;font-weight:400;color:var(--muted);font-size:11px;margin-top:3px;}
  .subnote{font-size:11px;color:var(--muted);line-height:1.5;}

  .tnved-btn{display:inline-flex;align-items:center;gap:6px;background:var(--accent-ink);color:#fff;border:0;border-radius:7px;padding:9px 14px;font-size:12.5px;font-weight:600;cursor:pointer;width:max-content;}
  .tnved-btn:hover{background:var(--accent);}

  .hint-box{background:#fff;border:1px dashed var(--line);border-radius:7px;padding:10px 12px;font-size:11.5px;color:var(--muted);}
  h3.sub{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:4px 0 0;}

  /* ---------- graph 54 ---------- */
  .g54{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:18px;}
  @media (max-width:900px){.g54{grid-template-columns:1fr;}}
  .sub54{display:grid;grid-template-columns:26px minmax(0,1fr);gap:12px;padding:12px 0;border-top:1px solid var(--line);}
  .sub54:first-of-type{border-top:0;padding-top:0;}
  .sub54-num{font-family:var(--mono);font-weight:800;font-size:14px;color:var(--ink);}
  .sub54-body{display:grid;gap:10px;}

  /* ---------- popover ---------- */

  .foot-block{background:#F3F0E8;border-top:1px dashed var(--line);}

  /* ---------- XML drawer ---------- */
.dt-prototype{font-weight:400;line-height:normal;text-align:left;letter-spacing:normal;border-radius:10px;overflow:hidden;}
.dt-prototype{width:100%;max-width:1380px;padding:18px;border:1px solid #111;background:#fff;border-radius:0;overflow:visible;}
.dt-prototype .field input{line-height:normal;}
.dt-prototype .board{max-width:none;padding:0;}
.document-title{margin:0 0 16px;padding-bottom:10px;border-bottom:3px solid #0c5fd7;color:#2b2b2b;font-size:17px;font-weight:700;line-height:1.3;text-transform:uppercase;}
.goods-actions{display:flex;gap:8px;padding:10px 18px 0;}
.goods-actions button{border:1px solid var(--line);background:white;color:var(--accent-ink);padding:7px 12px;border-radius:6px;cursor:pointer;}
.info-backdrop{position:fixed;inset:0;background:#10203c66;z-index:1000;display:grid;place-items:center;padding:20px;}
.info-panel{position:relative;max-height:80vh;overflow:auto;max-width:520px;padding:24px;background:white;color:var(--ink);border-radius:10px;font-size:13px;}
.info-panel h3{margin:0 30px 12px 0;}.info-panel p{line-height:1.6;}.info-panel a{color:var(--accent);}
.info-close{position:absolute;top:10px;right:12px;border:0;background:none;font-size:22px;cursor:pointer;}

</style>
