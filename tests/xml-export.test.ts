import { expect, test } from 'bun:test'
import { buildDeclarationXml } from '../shared/aideclarant/xml'
import { createEmptyDraft, removeGoodsAt, updateDraftValue } from '../shared/aideclarant/declaration'

test('single-item XML matches the supplied prototype template, including namespaces and empty nodes', async () => {
  // Reference extracted from the supplied HTML, with empty form values and sheet/item defaults.
  const reference = await Bun.file(new URL('./fixtures/dt-prototype-empty.xml', import.meta.url)).text()
  expect(buildDeclarationXml(createEmptyDraft())).toBe(reference)
})

test('XML preserves independent goods, manual codes and amounts after a deletion', () => {
  let draft = createEmptyDraft(3)
  draft = updateDraftValue(draft, 'g31-desc', 'First item', 0)
  draft = updateDraftValue(draft, 'g31-desc', 'Second item', 1)
  draft = updateDraftValue(draft, 'g31-desc', 'Third item', 2)
  draft = updateDraftValue(draft, 'g33-tnved', '8422909000', 2)
  draft = updateDraftValue(draft, 'g35-gross', '490', 2)
  draft = updateDraftValue(draft, 'g38-net', '420', 2)
  draft = updateDraftValue(draft, 'g45-cval', '12345.67', 2)
  draft = removeGoodsAt(draft, 1)
  const xml = buildDeclarationXml(draft)
  expect(xml.match(/<ESADout_CU:ESADout_CUGoods>/g)).toHaveLength(2)
  expect(xml).toContain('<catESAD_cu:TotalGoodsNumber>2</catESAD_cu:TotalGoodsNumber>')
  expect(xml).toContain('<catESAD_cu:GoodsNumeric>2</catESAD_cu:GoodsNumeric>')
  expect(xml).toContain('<catESAD_cu:GoodsDescription>Third item</catESAD_cu:GoodsDescription>')
  expect(xml).toContain('<catESAD_cu:GoodsTNVEDCode>8422909000</catESAD_cu:GoodsTNVEDCode>')
  expect(xml).toContain('<catESAD_cu:GrossWeightQuantity>490</catESAD_cu:GrossWeightQuantity>')
  expect(xml).toContain('<catESAD_cu:NetWeightQuantity>420</catESAD_cu:NetWeightQuantity>')
  expect(xml).toContain('<catESAD_cu:CustomsCost>12345.67</catESAD_cu:CustomsCost>')
  expect(xml).not.toContain('Second item')
  expect(draft.goodsCount).toBe('2')
})

test('XML escapes text and retains Unicode while preventing injected nodes and invalid XML characters', () => {
  let draft = updateDraftValue(createEmptyDraft(), 'g2-name', '  ООО «A&B» <tag>😀\u0000\ud800  ')
  draft = updateDraftValue(draft, 'g31-desc', 'One\nTwo & three </catESAD_cu:GoodsDescription>')
  const xml = buildDeclarationXml(draft)
  expect(xml).toContain('ООО «A&amp;B» &lt;tag&gt;😀\uFFFD\uFFFD')
  expect(xml).toContain('One\nTwo &amp; three &lt;/catESAD_cu:GoodsDescription&gt;')
  expect(xml).not.toContain('\u0000')
  expect(xml).not.toContain('<tag>')
})

test('XML carries checkbox choices, separate INN/KPP and container state without editor UI', () => {
  let draft = createEmptyDraft()
  for (const [key, value] of Object.entries({ 'g2-same': 'true', 'g8-contragent': 'true', 'g8-inn': '7705123456/770501001', 'g19-cont': '0' })) {
    draft = updateDraftValue(draft, key, value)
  }
  const xml = buildDeclarationXml(draft)
  expect(xml).toContain('<RUDECLcat:EqualIndicator>true</RUDECLcat:EqualIndicator>')
  expect(xml).toContain('<RUDECLcat:EqualIndicator>false</RUDECLcat:EqualIndicator>')
  expect(xml).toContain('<RUDECLcat:SubjectAdditionalCode>1</RUDECLcat:SubjectAdditionalCode>')
  expect(xml).toContain('<cat_ru:INN>7705123456</cat_ru:INN>')
  expect(xml).toContain('<cat_ru:KPP>770501001</cat_ru:KPP>')
  expect(xml).toContain('<catESAD_cu:ContainerIndicator>false</catESAD_cu:ContainerIndicator>')
  expect(xml).not.toMatch(/alta\.ru|Рекомендации|Правило заполнения|Карта источников|schemaVersion|goodsCount/)
  expect(buildDeclarationXml(updateDraftValue(draft, 'g19-cont', '1'))).toContain('<catESAD_cu:ContainerIndicator>true</catESAD_cu:ContainerIndicator>')
})
