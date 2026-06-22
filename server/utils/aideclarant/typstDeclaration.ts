import type { DeclarationDraft } from './types'

const text = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

const get = (draft: DeclarationDraft, key: string) => text(draft[key])

export const buildTypstDeclarationData = (draft: DeclarationDraft) => {
  return {
    title: get(draft, 'title') || 'НАЗВАНИЕ ДЕКЛАРАЦИИ',

    'sender.country': get(draft, 'Страна'),
    'sender.postal_code': get(draft, 'Почтовый код'),
    'sender.city': get(draft, 'Область, район, населённый пункт'),
    'sender.address': get(draft, 'Адрес'),
    'sender.inn_kpp': get(draft, 'ИНН/КПП'),
    'sender.okpo': get(draft, 'ОКПО'),

    'receiver.country': get(draft, '__receiver__Страна'),
    'receiver.postal_code': get(draft, '__receiver__Почтовый код'),
    'receiver.city': get(draft, '__receiver__Область, район, населённый пункт'),
    'receiver.address': get(draft, '__receiver__Адрес'),
    'receiver.inn_kpp': get(draft, '__receiver__ИНН/КПП'),
    'receiver.okpo': get(draft, '__receiver__ОКПО'),

    'general.declaration': get(draft, '1 Декларация'),
    'general.internal_number': get(draft, 'A Внутренний номер'),
    'general.form': get(draft, '3 Форма'),
    'general.special_procedure': get(draft, '4 Спец. процедура'),
    'general.registration_number': get(draft, 'B Регистрационный номер'),
    'general.total_goods': get(draft, '5 Всего товаров'),
    'general.net_weight': get(draft, '6 Вес нетто'),
    'general.features': get(draft, '7 Особенности декларирования'),
    'general.submitter': get(draft, '9 Лицо, от имени которого подаётся декларация'),

    'transport.departure_transport': get(draft, '18 Вид транспорта при отправлении'),
    'transport.border_transport': get(draft, '21 Вид транспорта на границе'),
    'transport.currency_total': get(draft, '22 Валюта и общая сумма'),
    'transport.exchange_rate': get(draft, '23 Курс валюты'),
    'transport.deal_type': get(draft, '24 Характер сделки'),
    'transport.border_customs': get(draft, '29 Таможня на границе'),
    'transport.goods_location': get(draft, '30 Местонахождение товаров'),
    'transport.countries': get(draft, '15 Страна отправления / 16 Страна происхождения / 17 Страна назначения'),

    'customs.trade_country': get(draft, '11 Торговая страна'),
    'customs.total_customs_value': get(draft, '12 Общая таможенная стоимость'),
    'customs.terms': get(draft, '13 Условия'),

    'goods.description': get(draft, '31 Грузовые места и описание товаров'),
    'goods.number': get(draft, '32 Товар №'),
    'goods.tnved': get(draft, '33 ТН ВЭД'),
    'goods.origin_country': get(draft, '34 Страна происх.'),
    'goods.gross_weight': get(draft, '35 Вес брутто'),
    'goods.net_weight': get(draft, '38 Вес нетто'),
    'goods.quantity': get(draft, 'Количество'),
    'goods.unit': get(draft, 'Ед. изм.'),
    'goods.quota': get(draft, '39 Квота'),
    'goods.previous_document': get(draft, '40 Предшествующий документ'),
    'goods.additional_unit': get(draft, '41 Доп. единица измерения'),
    'goods.price': get(draft, '42 Цена товара'),
    'goods.documents': get(draft, '44 Дополнительная информация / документы'),

    'payments.calculation': get(draft, '47 Исчисление платежей'),
    'payments.delay': get(draft, '48 Отсрочка платежей'),
    'payments.customs_value': get(draft, '45 Таможенная стоимость'),
    'payments.stat_value': get(draft, '46 Статистическая стоимость'),

    'declarant.info': get(draft, 'Информация о декларанте'),

    'representative.name': get(draft, 'Таможенный представитель'),
    'representative.client_contract': get(draft, 'Договор с клиентом'),
    'representative.declarant': get(draft, 'Декларант'),
    'representative.identity_document': get(draft, 'Документ, удостоверяющий личность'),
    'representative.authority_document': get(draft, 'Документ, подтверждающий полномочия'),
    'representative.customs_marks': get(draft, 'Отметки таможни'),
    'representative.decision': get(draft, 'Решение по ДТ'),
  }
}
