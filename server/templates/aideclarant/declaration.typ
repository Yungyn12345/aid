// declaration_typst_a4_portrait_flow.typ
// A4 portrait-версия декларации под визуал третьего этапа.
// Блок рекомендаций ТН ВЭД удалён.
// Поля остаются компактными на пустых данных, но при длинном тексте переходят в auto-height.
// Генерация: typst compile declaration_typst_a4_portrait_flow.typ declaration.pdf

#set page(
  paper: "a4",
  margin: (x: 4mm, y: 4mm),
)

#set text(
  font: ("Noto Sans", "Liberation Sans", "New Computer Modern"),
  size: 4.85pt,
  fill: black,
)

#set par(leading: 0.32em)

#let blue = rgb("#0C5FD7")
#let group-bg = rgb("#F7F7F7")
#let border-color = rgb("#9F9F9F")
#let field-line = rgb("#C8C8C8")
#let title-color = rgb("#2B2B2B")
#let label-color = rgb("#333333")
#let placeholder-color = rgb("#7A7A7A")
#let white-bg = rgb("#FFFFFF")

// В интеграции можно заменить на:
// #let declaration-data = json("declaration-data.json")
#let data-file = sys.inputs.at("data", default: "declaration-data.json")
#let declaration-data = json(data-file)
#let val(key) = declaration-data.at(key, default: "")

#let shown(value, placeholder) = {
  if value == "" {
    text(size: 4.05pt, weight: "regular", fill: placeholder-color)[#placeholder]
  } else {
    text(size: 4.25pt, weight: "regular", fill: black)[#value]
  }
}

// Если значение короткое или пустое - держим базовую высоту, чтобы шаблон помещался на 1 страницу.
// Если значение длиннее лимита - включаем auto-height: поле растёт по содержимому,
// а документ при необходимости уходит на 2-й лист.
#let should-flow(value, limit) = value != "" and value.len() > limit

#let field(label, value, placeholder: "", height: 5.15mm, flow-limit: 56) = {
  let valueContent = shown(value, placeholder)
  let fieldRect = if should-flow(value, flow-limit) {
    rect(
      width: 100%,
      stroke: 0.28pt + field-line,
      fill: white-bg,
      inset: (x: 1.15pt, y: 0.8pt),
    )[#valueContent]
  } else {
    rect(
      width: 100%,
      height: height,
      stroke: 0.28pt + field-line,
      fill: white-bg,
      inset: (x: 1.15pt, y: 0.8pt),
    )[#valueContent]
  }

  block(width: 100%)[
    #text(size: 3.9pt, weight: "bold", fill: label-color)[#label]
    #v(0.25pt)
    #fieldRect
  ]
}

#let textarea(label, value, placeholder: "", height: 11mm, flow-limit: 140) = {
  let valueContent = shown(value, placeholder)
  let fieldRect = if should-flow(value, flow-limit) {
    rect(
      width: 100%,
      stroke: 0.28pt + field-line,
      fill: white-bg,
      inset: (x: 1.15pt, y: 0.85pt),
    )[#valueContent]
  } else {
    rect(
      width: 100%,
      height: height,
      stroke: 0.28pt + field-line,
      fill: white-bg,
      inset: (x: 1.15pt, y: 0.85pt),
    )[#valueContent]
  }

  block(width: 100%)[
    #text(size: 3.9pt, weight: "bold", fill: label-color)[#label]
    #v(0.25pt)
    #fieldRect
  ]
}

#let group(title, body) = rect(
  width: 100%,
  stroke: 0.32pt + border-color,
  fill: group-bg,
  inset: 2pt,
)[
  #text(size: 5pt, weight: "bold", fill: title-color)[#title]
  #v(0.8pt)
  #body
]

// Header
#block(width: 100%)[
  #text(size: 8.2pt, weight: "bold", fill: title-color)[#upper(val("title"))]
  #v(1.4pt)
  #line(length: 100%, stroke: 0.65pt + blue)
]

#v(1pt)

// Top grid, like the third stage UI: left 58%, right 42%.
#grid(
  columns: (58fr, 42fr),
  gutter: 1.6pt,
  [
    #group("Отправитель")[
      #grid(
        columns: 3,
        gutter: 1.6pt,
        field("Страна", val("sender.country"), placeholder: "Введите страну"),
        field("Почтовый код", val("sender.postal_code"), placeholder: "Почтовый индекс"),
        field("Область, район, населённый пункт", val("sender.city"), placeholder: "Населённый пункт", flow-limit: 72),
        grid.cell(colspan: 2)[#field("Адрес", val("sender.address"), placeholder: "Полный адрес", flow-limit: 92)],
        field("ИНН/КПП", val("sender.inn_kpp"), placeholder: "ИНН"),
        field("ОКПО", val("sender.okpo"), placeholder: "ОКПО"),
      )
    ]

    #v(1.6pt)

    #group("Получатель")[
      #grid(
        columns: 3,
        gutter: 1.6pt,
        field("Страна", val("receiver.country"), placeholder: "Введите страну"),
        field("Почтовый код", val("receiver.postal_code"), placeholder: "Почтовый индекс"),
        field("Область, район, населённый пункт", val("receiver.city"), placeholder: "Населённый пункт", flow-limit: 72),
        grid.cell(colspan: 2)[#field("Адрес", val("receiver.address"), placeholder: "Полный адрес", flow-limit: 92)],
        field("ИНН/КПП", val("receiver.inn_kpp"), placeholder: "ИНН"),
        field("ОКПО", val("receiver.okpo"), placeholder: "ОКПО"),
      )
    ]

    #v(1.6pt)

    #group("Транспорт / условия поставки")[
      #grid(
        columns: 3,
        gutter: 1.6pt,
        field("18 Вид транспорта при отправлении", val("transport.departure_transport"), placeholder: "Тип транспорта"),
        field("21 Вид транспорта на границе", val("transport.border_transport"), placeholder: "Тип транспорта"),
        field("22 Валюта и общая сумма", val("transport.currency_total"), placeholder: "Валюта, сумма"),
        field("23 Курс валюты", val("transport.exchange_rate"), placeholder: "Курс"),
        field("24 Характер сделки", val("transport.deal_type"), placeholder: "Характер сделки"),
        field("29 Таможня на границе", val("transport.border_customs"), placeholder: "Таможня"),
        field("30 Местонахождение товаров", val("transport.goods_location"), placeholder: "Местонахождение"),
        grid.cell(colspan: 2)[#field("15 Страна отправления / 16 Страна происхождения / 17 Страна назначения", val("transport.countries"), placeholder: "Коды стран")],
      )
    ]
  ],
  [
    #group("Общие сведения")[
      #grid(
        columns: 3,
        gutter: 1.6pt,
        field("1 Декларация", val("general.declaration"), placeholder: "Номер декларации"),
        field("A Внутренний номер", val("general.internal_number"), placeholder: "Внутренний номер"),
        field("3 Форма", val("general.form"), placeholder: "Форма ДТ"),
        field("4 Спец. процедура", val("general.special_procedure"), placeholder: "Спец. процедура"),
        field("B Регистрационный номер", val("general.registration_number"), placeholder: "Рег. номер"),
        field("5 Всего товаров", val("general.total_goods"), placeholder: "0"),
        field("6 Вес нетто", val("general.net_weight"), placeholder: "кг"),
        field("7 Особенности декларирования", val("general.features"), placeholder: "Особенности"),
        field("", "", placeholder: ""),
        grid.cell(colspan: 3)[#field("9 Лицо, от имени которого подаётся декларация", val("general.submitter"), placeholder: "ФИО и должность", height: 5.3mm)],
      )
    ]

    #v(1.6pt)

    #group("Таможенная стоимость")[
      #grid(
        columns: 3,
        gutter: 1.6pt,
        field("11 Торговая страна", val("customs.trade_country"), placeholder: "Код страны"),
        field("12 Общая таможенная стоимость", val("customs.total_customs_value"), placeholder: "Сумма"),
        field("13 Условия", val("customs.terms"), placeholder: "Условия"),
      )
    ]
  ],
)

#v(1.6pt)

#group("Товары")[
  #grid(
    columns: 4,
    gutter: 1.6pt,
    grid.cell(colspan: 4)[#textarea("31 Грузовые места и описание товаров", val("goods.description"), placeholder: "Здесь можно ввести описание товаров. Нейросеть может автоматически заполнить это поле на основе загруженных документов.", height: 21mm, flow-limit: 320)],
    field("32 Товар №", val("goods.number"), placeholder: "№"),
    field("33 ТН ВЭД", val("goods.tnved"), placeholder: "Код ТН ВЭД"),
    field("34 Страна происх.", val("goods.origin_country"), placeholder: "Код страны"),
    field("35 Вес брутто", val("goods.gross_weight"), placeholder: "кг"),
    field("38 Вес нетто", val("goods.net_weight"), placeholder: "кг"),
    field("Количество", val("goods.quantity"), placeholder: "Кол-во"),
    field("Ед. изм.", val("goods.unit"), placeholder: "pcs / kg / etc"),
    field("39 Квота", val("goods.quota"), placeholder: "Квота"),
    field("40 Предшествующий документ", val("goods.previous_document"), placeholder: "№ документа"),
    field("41 Доп. единица измерения", val("goods.additional_unit"), placeholder: "Ед. измерения"),
    field("42 Цена товара", val("goods.price"), placeholder: "Цена"),
    field("", "", placeholder: ""),
    grid.cell(colspan: 4)[#textarea("44 Дополнительная информация / документы", val("goods.documents"), placeholder: "Дополнительная информация, комментарии, примечания...", height: 10.2mm, flow-limit: 150)],
  )
]

#v(1.6pt)

#group("Платежи")[
  #grid(
    columns: 2,
    gutter: 1.6pt,
    field("47 Исчисление платежей", val("payments.calculation"), placeholder: "Расчёт платежей"),
    field("48 Отсрочка платежей", val("payments.delay"), placeholder: "Условия отсрочки"),
    field("45 Таможенная стоимость", val("payments.customs_value"), placeholder: "Стоимость"),
    field("46 Статистическая стоимость", val("payments.stat_value"), placeholder: "Стат. стоимость"),
  )
]

#v(1.6pt)

#group("50 Декларант / доверитель")[
  #textarea("Информация о декларанте", val("declarant.info"), placeholder: "Информация о декларанте...", height: 10.2mm, flow-limit: 150)
]

#v(1.6pt)

#group("54 Сведения о таможенном представителе / Отметки таможни")[
  #grid(
    columns: 3,
    gutter: 1.6pt,
    grid.cell(colspan: 2)[#field("Таможенный представитель", val("representative.name"), placeholder: "Наименование")],
    field("Договор с клиентом", val("representative.client_contract"), placeholder: "№ договора"),
    field("Декларант", val("representative.declarant"), placeholder: "ФИО декларанта"),
    field("Документ, удостоверяющий личность", val("representative.identity_document"), placeholder: "Паспортные данные"),
    field("Документ, подтверждающий полномочия", val("representative.authority_document"), placeholder: "Доверенность"),
    grid.cell(colspan: 3)[#textarea("Отметки таможни", val("representative.customs_marks"), placeholder: "Отметки таможенных органов...", height: 10.2mm, flow-limit: 150)],
    grid.cell(colspan: 3)[#textarea("Решение по ДТ", val("representative.decision"), placeholder: "Решение таможенного органа...", height: 10.2mm, flow-limit: 150)],
  )
]
