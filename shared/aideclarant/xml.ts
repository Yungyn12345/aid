import { canonicalDraft, draftValue } from './declaration'
import type { DeclarationDraft } from './types'

// Structure, namespace versions and mapped fields follow the supplied prototype.
// This template is not a complete mapping of every field in the editor.
const esc = (text: string) => text
  .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '\uFFFD')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const buildDeclarationXml = (input: DeclarationDraft): string => {
  const draft = canonicalDraft(input)
  const v = (key: string) => draftValue(draft, key).trim()
  const same = (prefix: string) => draft[`${prefix}-same`] === 'true'
  const contragent = (prefix: string) => draft[`${prefix}-contragent`] === 'true'
  const dir = v('g1-dir'), proc = v('g1-proc'), ed = v('g1-ed')
  const goods = Array.from({ length: Number(draft.goodsCount) }, (_, index) => {
    const v = (key: string) => draftValue(draft, key, index).trim()
    return `\t\t<ESADout_CU:ESADout_CUGoods>
\t\t\t<catESAD_cu:GoodsNumeric>${esc(v('g32-num'))}</catESAD_cu:GoodsNumeric>
\t\t\t<catESAD_cu:GoodsDescription>${esc(v('g31-desc'))}</catESAD_cu:GoodsDescription>
\t\t\t<catESAD_cu:GrossWeightQuantity>${esc(v('g35-gross'))}</catESAD_cu:GrossWeightQuantity>
\t\t\t<catESAD_cu:NetWeightQuantity>${esc(v('g38-net'))}</catESAD_cu:NetWeightQuantity>
\t\t\t<catESAD_cu:CustomsCost>${esc(v('g45-cval'))}</catESAD_cu:CustomsCost>
\t\t\t<catESAD_cu:GoodsTNVEDCode>${esc(v('g33-tnved'))}</catESAD_cu:GoodsTNVEDCode>
\t\t\t<catESAD_cu:OriginCountryCode>${esc(v('g34-origin'))}</catESAD_cu:OriginCountryCode>
\t\t\t<catESAD_cu:OriginCountryName></catESAD_cu:OriginCountryName>
\t\t\t<ESADout_CU:LanguageGoods>RU</ESADout_CU:LanguageGoods>
\t\t</ESADout_CU:ESADout_CUGoods>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<ESADout_CU:ESADout_CU DocumentModeID="1006107E" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:catESAD_cu="urn:customs.ru:CUESADCommonAggregateTypesCust:5.15.0" xmlns:cat_ru="urn:customs.ru:CommonAggregateTypes:5.10.0" xmlns:ESADout_CU="urn:customs.ru:Information:CustomsDocuments:ESADout_CU:5.15.0" xmlns:RUDECLcat="urn:customs.ru:RUDeclCommonAggregateTypesCust:5.15.0" xmlns:RUScat_ru="urn:customs.ru:RUSCommonAggregateTypes:5.15.0">
\t<cat_ru:DocumentID></cat_ru:DocumentID>
\t<cat_ru:RefDocumentID></cat_ru:RefDocumentID>
\t<ESADout_CU:EECEDocHeaderAddInfo>
\t\t<RUScat_ru:InfEnvelopeCode></RUScat_ru:InfEnvelopeCode>
\t\t<RUScat_ru:EDocCode></RUScat_ru:EDocCode>
\t\t<RUScat_ru:EDocDateTime></RUScat_ru:EDocDateTime>
\t\t<RUScat_ru:LanguageCode>RU</RUScat_ru:LanguageCode>
\t</ESADout_CU:EECEDocHeaderAddInfo>
\t<ESADout_CU:CustomsProcedure>${esc(dir)}</ESADout_CU:CustomsProcedure>
\t<ESADout_CU:CustomsModeCode>${esc(proc)}</ESADout_CU:CustomsModeCode>
\t<ESADout_CU:TransitDirectionCode>${esc(dir)}</ESADout_CU:TransitDirectionCode>
\t<ESADout_CU:ElectronicDocumentSign>${esc(ed)}</ESADout_CU:ElectronicDocumentSign>
\t<ESADout_CU:DeclarationKind></ESADout_CU:DeclarationKind>
\t<ESADout_CU:RecipientCountryCode>${esc(v('g17-code'))}</ESADout_CU:RecipientCountryCode>
\t<ESADout_CU:ESADout_CUGoodsShipment>
\t\t<catESAD_cu:OriginCountryName>${esc(v('g16-origin'))}</catESAD_cu:OriginCountryName>
\t\t<catESAD_cu:OriginCountryCode></catESAD_cu:OriginCountryCode>
\t\t<catESAD_cu:SpecificationNumber>${esc(v('g3-sheet'))}</catESAD_cu:SpecificationNumber>
\t\t<catESAD_cu:SpecificationListNumber>${esc(v('g3-total'))}</catESAD_cu:SpecificationListNumber>
\t\t<catESAD_cu:TotalGoodsNumber>${esc(v('g5-goods'))}</catESAD_cu:TotalGoodsNumber>
\t\t<catESAD_cu:TotalPackageNumber>${esc(v('g6-pkg'))}</catESAD_cu:TotalPackageNumber>
\t\t<catESAD_cu:TotalSheetNumber></catESAD_cu:TotalSheetNumber>
\t\t<ESADout_CU:ESADout_CUConsignor>
\t\t\t<RUDECLcat:EqualIndicator>${same('g2') ? 'true' : 'false'}</RUDECLcat:EqualIndicator>
\t\t\t<RUDECLcat:SubjectAdditionalCode>${contragent('g2') ? '1' : ''}</RUDECLcat:SubjectAdditionalCode>
\t\t\t<cat_ru:OrganizationName>${esc(v('g2-name'))}</cat_ru:OrganizationName>
\t\t\t<cat_ru:RFOrganizationFeatures>
\t\t\t\t<cat_ru:OGRN>${esc(v('g2-ogrn'))}</cat_ru:OGRN>
\t\t\t\t<cat_ru:INN>${esc(v('g2-inn').split('/')[0]||'')}</cat_ru:INN>
\t\t\t\t<cat_ru:KPP>${esc(v('g2-inn').split('/')[1]||'')}</cat_ru:KPP>
\t\t\t</cat_ru:RFOrganizationFeatures>
\t\t\t<RUScat_ru:SubjectAddressDetails>
\t\t\t\t<RUScat_ru:AddressText>${esc(v('g2-addr'))}</RUScat_ru:AddressText>
\t\t\t</RUScat_ru:SubjectAddressDetails>
\t\t</ESADout_CU:ESADout_CUConsignor>
\t\t<ESADout_CU:ESADout_CUConsignee>
\t\t\t<RUDECLcat:EqualIndicator>${same('g8') ? 'true' : 'false'}</RUDECLcat:EqualIndicator>
\t\t\t<RUDECLcat:SubjectAdditionalCode>${contragent('g8') ? '1' : ''}</RUDECLcat:SubjectAdditionalCode>
\t\t\t<cat_ru:OrganizationName>${esc(v('g8-name'))}</cat_ru:OrganizationName>
\t\t\t<cat_ru:RFOrganizationFeatures>
\t\t\t\t<cat_ru:OGRN>${esc(v('g8-ogrn'))}</cat_ru:OGRN>
\t\t\t\t<cat_ru:INN>${esc(v('g8-inn').split('/')[0]||'')}</cat_ru:INN>
\t\t\t\t<cat_ru:KPP>${esc(v('g8-inn').split('/')[1]||'')}</cat_ru:KPP>
\t\t\t</cat_ru:RFOrganizationFeatures>
\t\t\t<RUScat_ru:SubjectAddressDetails>
\t\t\t\t<RUScat_ru:AddressText>${esc(v('g8-addr'))}</RUScat_ru:AddressText>
\t\t\t</RUScat_ru:SubjectAddressDetails>
\t\t</ESADout_CU:ESADout_CUConsignee>
\t\t<ESADout_CU:ESADout_CUDeclarant>
\t\t\t<cat_ru:OrganizationName>${esc(v('g14-name'))}</cat_ru:OrganizationName>
\t\t\t<cat_ru:OrganizationLanguage>RU</cat_ru:OrganizationLanguage>
\t\t\t<cat_ru:RFOrganizationFeatures>
\t\t\t\t<cat_ru:OGRN>${esc(v('g14-ogrn'))}</cat_ru:OGRN>
\t\t\t\t<cat_ru:INN>${esc(v('g14-inn').split('/')[0]||'')}</cat_ru:INN>
\t\t\t\t<cat_ru:KPP>${esc(v('g14-inn').split('/')[1]||'')}</cat_ru:KPP>
\t\t\t</cat_ru:RFOrganizationFeatures>
\t\t\t<RUScat_ru:SubjectAddressDetails>
\t\t\t\t<RUScat_ru:AddressText>${esc(v('g14-addr'))}</RUScat_ru:AddressText>
\t\t\t</RUScat_ru:SubjectAddressDetails>
\t\t</ESADout_CU:ESADout_CUDeclarant>
\t\t<ESADout_CU:ESADout_CUConsigment>
\t\t\t<catESAD_cu:ContainerIndicator>${esc(v('g19-cont')==='1'?'true':(v('g19-cont')==='0'?'false':''))}</catESAD_cu:ContainerIndicator>
\t\t\t<catESAD_cu:DispatchCountryCode>${esc(v('g15-code'))}</catESAD_cu:DispatchCountryCode>
\t\t\t<catESAD_cu:DispatchCountryName>${esc(v('g15-name'))}</catESAD_cu:DispatchCountryName>
\t\t\t<catESAD_cu:DestinationCountryCode>${esc(v('g17-code'))}</catESAD_cu:DestinationCountryCode>
\t\t\t<catESAD_cu:DestinationCountryName>${esc(v('g17-name'))}</catESAD_cu:DestinationCountryName>
\t\t\t<ESADout_CU:ESADout_CUBorderTransport>
\t\t\t\t<cat_ru:TransportModeCode>${esc(v('g25-mode'))}</cat_ru:TransportModeCode>
\t\t\t\t<cat_ru:TransportNationalityCode></cat_ru:TransportNationalityCode>
\t\t\t</ESADout_CU:ESADout_CUBorderTransport>
\t\t\t<ESADout_CU:PPBorderCustoms>
\t\t\t\t<cat_ru:Code>${esc(v('g29-office'))}</cat_ru:Code>
\t\t\t\t<cat_ru:OfficeName></cat_ru:OfficeName>
\t\t\t\t<cat_ru:CustomsCountryCode></cat_ru:CustomsCountryCode>
\t\t\t</ESADout_CU:PPBorderCustoms>
\t\t</ESADout_CU:ESADout_CUConsigment>
\t\t<ESADout_CU:ESADout_CUMainContractTerms>
\t\t\t<catESAD_cu:ContractCurrencyCode>${esc(v('g22-cur'))}</catESAD_cu:ContractCurrencyCode>
\t\t\t<catESAD_cu:TotalInvoiceAmount>${esc(v('g22-sum'))}</catESAD_cu:TotalInvoiceAmount>
\t\t\t<catESAD_cu:TradeCountryCode>${esc(v('g11-trade'))}</catESAD_cu:TradeCountryCode>
\t\t\t<catESAD_cu:CUESADDeliveryTerms>
\t\t\t\t<cat_ru:DeliveryTermsStringCode>${esc(v('g20-code'))}</cat_ru:DeliveryTermsStringCode>
\t\t\t\t<cat_ru:DeliveryPlace>${esc(v('g20-place'))}</cat_ru:DeliveryPlace>
\t\t\t</catESAD_cu:CUESADDeliveryTerms>
\t\t</ESADout_CU:ESADout_CUMainContractTerms>
${goods}
\t</ESADout_CU:ESADout_CUGoodsShipment>
</ESADout_CU:ESADout_CU>`
}
