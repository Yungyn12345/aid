import { declarationFields, declarationSections } from '../../../shared/aideclarant/schema'
import { canonicalDraft, draftValue } from '../../../shared/aideclarant/declaration'
import type { DeclarationDraft } from './types'

export const buildTypstDeclarationData = (input: DeclarationDraft) => {
  const draft = canonicalDraft(input)
  const count = Number(draft.goodsCount) || 1
  const sections = declarationSections.flatMap(section => {
    const definitions = section.fields.map(id => declarationFields.find(field => field.id === id)!)
    const hasGoods = definitions.some(field => field.controls.some(control => control.goods))
    return Array.from({ length: hasGoods ? count : 1 }, (_, index) => ({
      title: section.title.replace(/^(\d+)(?=\p{L})/u, '$1 · ') + (hasGoods && count > 1 ? ` · Товар ${index + 1}` : ''),
      checkboxes: definitions.some(field => field.graph === '2' || field.graph === '8') ? [
        { label: 'СМ. ГРАФУ 14 ДТ', checked: draft[`g${definitions[0]!.graph}-same`] === 'true' },
        { label: 'КОНТРАГЕНТ', checked: draft[`g${definitions[0]!.graph}-contragent`] === 'true' },
      ] : [],
      fields: definitions.filter(field => field.graph !== 'B' || index === 0).map(field => ({
        label: [field.graph, field.label].filter(Boolean).join(' · '),
        wide: field.controls.some(control => control.type === 'textarea') || field.controls.length > 3,
        controls: field.controls.map(control => ({
          label: field.controls.length > 1 ? control.placeholder || '' : '',
          value: /^g[28]-(name|addr|ogrn|inn)$/.test(control.key) && draft[`${control.key.slice(0, 2)}-same`] === 'true' ? (control.key.endsWith('-name') ? 'СМ. ГРАФУ 14 ДТ' : '') : draftValue(draft, control.key, index),
          disabled: control.disabled,
        })),
      })),
    }))
  })
  return { title: 'Декларация на товары', sections }
}
