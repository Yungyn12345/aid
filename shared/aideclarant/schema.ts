// Imported from the user supplied DT prototype. Source-map UI is intentionally omitted.
export type DeclarationControl = { key: string; type: string; placeholder?: string; disabled: boolean; className?: string; rows?: number; goods: boolean }
export type DeclarationField = { id: string; graph: string; label: string; required: boolean; rule: string; related: string; links: Array<{ label: string; url: string }>; controls: DeclarationControl[] }
export type DeclarationSection = { id: string; title: string; fields: string[] }
export const declarationFields: DeclarationField[] = [
  {
    "id": "field-1",
    "graph": "2",
    "label": "Наименование организации",
    "required": true,
    "rule": "Сведения о лице, указанном отправителем товаров в транспортном (перевозочном) документе, по которому начинается перевозка. Для организации — краткое наименование.",
    "related": "Страна отправителя согласуется с графой 15. Наименование не должно противоречить продавцу по контракту (графа 44).",
    "links": [],
    "controls": [
      {
        "key": "g2-name",
        "type": "text",
        "placeholder": "краткое наименование отправителя",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-2",
    "graph": "2",
    "label": "Адрес",
    "required": true,
    "rule": "Место нахождения (адрес) отправителя: страна, почтовый индекс, населённый пункт, улица, дом, помещение.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g2-addr",
        "type": "textarea",
        "placeholder": "страна, индекс, город, улица, дом",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-3",
    "graph": "2",
    "label": "ОГРН",
    "required": true,
    "rule": "Основной государственный регистрационный номер организации.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g2-ogrn",
        "type": "text",
        "placeholder": "ОГРН",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-4",
    "graph": "2",
    "label": "ИНН / КПП",
    "required": true,
    "rule": "ИНН и КПП организации.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g2-inn",
        "type": "text",
        "placeholder": "ИНН/КПП",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-5",
    "graph": "1",
    "label": "Декларация",
    "required": true,
    "rule": "Три подраздела: 1) направление перемещения (ИМ/ЭК/ТТ); 2) двузначный код заявляемой таможенной процедуры; 3) «ЭД», если декларация электронная.",
    "related": "Код 2-го подраздела совпадает с первыми цифрами графы 37.",
    "links": [
      {
        "label": "Классификатор видов таможенных процедур (Прил. 1)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril1"
      }
    ],
    "controls": [
      {
        "key": "g1-dir",
        "type": "text",
        "placeholder": "ИМ/ЭК",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g1-proc",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g1-ed",
        "type": "text",
        "placeholder": "ЭД",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-6",
    "graph": "3",
    "label": "Форма",
    "required": false,
    "rule": "Номер текущего листа ДТ и общее число листов, включая добавочные ДТ2.",
    "related": "Зависит от графы 5: не более 3 товаров на лист ДТ2.",
    "links": [],
    "controls": [
      {
        "key": "g3-sheet",
        "type": "text",
        "placeholder": "лист",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g3-total",
        "type": "text",
        "placeholder": "всего",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-7",
    "graph": "4",
    "label": "Отгрузочные спецификации",
    "required": false,
    "rule": "Количество листов отгрузочных спецификаций, приложенных к декларации.",
    "related": "Согласуется с графой 44.",
    "links": [],
    "controls": [
      {
        "key": "g4-lists",
        "type": "text",
        "placeholder": "число листов",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-8",
    "graph": "5",
    "label": "Всего товаров",
    "required": true,
    "rule": "Общее количество товарных позиций в декларации.",
    "related": "Совпадает с числом карточек «Товар» и позиций в упаковочном листе/инвойсе.",
    "links": [],
    "controls": [
      {
        "key": "g5-goods",
        "type": "text",
        "placeholder": "кол-во",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-9",
    "graph": "6",
    "label": "Всего мест",
    "required": true,
    "rule": "Общее количество грузовых мест по всей поставке.",
    "related": "Сумма по товарам (гр. 31) должна равняться графе 6 и данным упаковочного листа.",
    "links": [],
    "controls": [
      {
        "key": "g6-pkg",
        "type": "text",
        "placeholder": "кол-во",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-10",
    "graph": "7",
    "label": "Справочный номер",
    "required": false,
    "rule": "Справочный (внутренний) номер декларации по учёту декларанта.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g7-reference",
        "type": "text",
        "placeholder": "номер",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-11",
    "graph": "8",
    "label": "Наименование организации",
    "required": true,
    "rule": "Сведения о лице, указанном получателем товаров в транспортном (перевозочном) документе. Для организации — краткое наименование.",
    "related": "Страна получателя согласуется с графой 17. Наименование не должно противоречить покупателю по контракту (графа 44).",
    "links": [],
    "controls": [
      {
        "key": "g8-name",
        "type": "text",
        "placeholder": "краткое наименование получателя",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-12",
    "graph": "8",
    "label": "Адрес",
    "required": true,
    "rule": "Место нахождения (адрес) получателя: страна, почтовый индекс, населённый пункт, улица, дом, помещение.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g8-addr",
        "type": "textarea",
        "placeholder": "страна, индекс, город, улица, дом",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-13",
    "graph": "8",
    "label": "ОГРН",
    "required": true,
    "rule": "Основной государственный регистрационный номер организации.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g8-ogrn",
        "type": "text",
        "placeholder": "ОГРН",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-14",
    "graph": "8",
    "label": "ИНН / КПП",
    "required": true,
    "rule": "ИНН и КПП организации.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g8-inn",
        "type": "text",
        "placeholder": "ИНН/КПП",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-15",
    "graph": "9",
    "label": "Лицо, ответственное за финансовое урегулирование",
    "required": false,
    "rule": "Наименование организации и её адрес — лицо, ответственное за финансовое урегулирование. Если сведения совпадают со сведениями о декларанте, допускается отметка «СМ. ГРАФУ 14 ДТ».",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g9-party",
        "type": "textarea",
        "placeholder": "наименование и адрес / СМ. ГРАФУ 14 ДТ",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-16",
    "graph": "10",
    "label": "Станция 1-го назначения (Ст. 1-го н.)",
    "required": false,
    "rule": "Графа «Станция 1-го назначения» (кратко — «Ст. 1-го н.»). По правилам заполнения ДТ эта графа не заполняется. Классификатор для неё не предусмотрен.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g10-unused",
        "type": "text",
        "placeholder": "не заполняется",
        "disabled": true,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-17",
    "graph": "11",
    "label": "Торгующая страна",
    "required": true,
    "rule": "Первый подраздел — код страны стороны сделки (государства, где находится контрагент декларанта по контракту). Второй подраздел графы не заполняется.",
    "related": "Может не совпадать со страной отправления (15) или происхождения (16).",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g11-trade",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g11-unused",
        "type": "text",
        "placeholder": "не заполняется",
        "disabled": true,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-18",
    "graph": "12",
    "label": "Общая таможенная стоимость",
    "required": true,
    "rule": "Общая таможенная стоимость всех товаров декларации.",
    "related": "Строго равна сумме граф 45 по каждому товару.",
    "links": [],
    "controls": [
      {
        "key": "g12-total",
        "type": "text",
        "placeholder": "сумма",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-19",
    "graph": "13",
    "label": "",
    "required": false,
    "rule": "Графа заполняется только в отдельных, установленных случаях.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g13-special",
        "type": "text",
        "placeholder": "в установленных случаях",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-20",
    "graph": "14",
    "label": "Наименование организации",
    "required": true,
    "rule": "Краткое наименование организации-декларанта — лица, подающего декларацию.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g14-name",
        "type": "text",
        "placeholder": "краткое наименование декларанта",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-21",
    "graph": "14",
    "label": "Адрес",
    "required": true,
    "rule": "Место нахождения (адрес) декларанта: страна, индекс, населённый пункт, улица, дом, помещение.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g14-addr",
        "type": "textarea",
        "placeholder": "страна, индекс, город, улица, дом",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-22",
    "graph": "14",
    "label": "ОГРН",
    "required": true,
    "rule": "Основной государственный регистрационный номер декларанта.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g14-ogrn",
        "type": "text",
        "placeholder": "ОГРН",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-23",
    "graph": "14",
    "label": "ИНН / КПП",
    "required": true,
    "rule": "ИНН и КПП декларанта.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g14-inn",
        "type": "text",
        "placeholder": "ИНН/КПП",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-24",
    "graph": "15",
    "label": "Страна отправления",
    "required": true,
    "rule": "Страна, из которой товар изначально отправлен в адрес получателя (по транспортному документу). Код страны — подраздел этой же графы, а не отдельная графа.",
    "related": "Согласуется со страной отправителя (графа 2).",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g15-name",
        "type": "text",
        "placeholder": "страна",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g15-code",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-25",
    "graph": "16",
    "label": "Страна происхождения",
    "required": true,
    "rule": "Страна происхождения товаров. Если товары одной поставки происходят из разных стран — указывается «РАЗНЫЕ», а конкретная страна каждого товара — в графе 34. Если страна происхождения неизвестна — указывается «НЕИЗВЕСТНА».",
    "related": "Связана с графой 34 (по каждому товару) и может влиять на графу 36 «Преференция».",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g16-origin",
        "type": "text",
        "placeholder": "Страна / РАЗНЫЕ / НЕИЗВЕСТНА",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-26",
    "graph": "17",
    "label": "Страна назначения",
    "required": true,
    "rule": "Страна, в которой товар будет использован либо потреблён — конечная страна назначения. Указать «РАЗНЫЕ» в этой графе нельзя. Код страны — подраздел этой же графы.",
    "related": "Согласуется со страной получателя (графа 8).",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g17-name",
        "type": "text",
        "placeholder": "страна",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g17-code",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-27",
    "graph": "18",
    "label": "Идентификация и страна регистрации ТС при отправлении/прибытии",
    "required": true,
    "rule": "Первый подраздел — регистрационный номер транспортного средства при отправлении/прибытии. Второй подраздел — код страны регистрации этого транспортного средства.",
    "related": "Не путать с графой 25 (вид транспорта).",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g18-vehicle",
        "type": "text",
        "placeholder": "номер ТС",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g18-country",
        "type": "text",
        "placeholder": "код страны",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-28",
    "graph": "19",
    "label": "Контейнер",
    "required": true,
    "rule": "Признак контейнерной перевозки: «0» — без контейнера, «1» — контейнером.",
    "related": "Согласуется с наличием номеров контейнеров в графе 31.",
    "links": [],
    "controls": [
      {
        "key": "g19-cont",
        "type": "text",
        "placeholder": "0 или 1",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-29",
    "graph": "20",
    "label": "Условия поставки",
    "required": true,
    "rule": "Графа заполняется, если декларируемые товары ввозятся в счёт исполнения обязательств по договору (контракту), заключённому при совершении внешнеэкономической сделки. Во втором подразделе указываются код условий поставки по классификатору и название географического пункта. Если базисы поставки по товарам ДТ различны либо базис один, но поставка идёт в разные географические пункты, во втором подразделе производится запись: «РАЗНЫЕ».",
    "related": "Должно совпадать с условием в контракте и инвойсе. Влияет на графы 45 и 46.",
    "links": [
      {
        "label": "Классификатор условий поставки (Прил. 13)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril13"
      }
    ],
    "controls": [
      {
        "key": "g20-code",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g20-place",
        "type": "text",
        "placeholder": "геогр. пункт / РАЗНЫЕ",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-30",
    "graph": "21",
    "label": "Идентификация и страна регистрации активного ТС на границе",
    "required": true,
    "rule": "Первый подраздел — идентификация активного транспортного средства, фактически пересекающего границу. Второй подраздел — код страны его регистрации.",
    "related": "Может отличаться от графы 18, если ТС менялось в пути.",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g21-vehicle",
        "type": "text",
        "placeholder": "номер ТС",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g21-country",
        "type": "text",
        "placeholder": "код страны",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-31",
    "graph": "22",
    "label": "Валюта и общая сумма по счёту",
    "required": true,
    "rule": "Код валюты счёта и общая сумма по счёту (инвойсу).",
    "related": "Сумма равна сумме граф 42 по всем товарам.",
    "links": [
      {
        "label": "Классификатор валют (Прил. 23)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril23"
      }
    ],
    "controls": [
      {
        "key": "g22-cur",
        "type": "text",
        "placeholder": "валюта",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g22-sum",
        "type": "text",
        "placeholder": "сумма",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-32",
    "graph": "23",
    "label": "Курс валюты",
    "required": true,
    "rule": "Курс валюты счёта к рублю на дату подачи декларации.",
    "related": "Используется при пересчёте граф 45 и 46.",
    "links": [],
    "controls": [
      {
        "key": "g23-rate",
        "type": "text",
        "placeholder": "курс",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-33",
    "graph": "24",
    "label": "Характер сделки",
    "required": true,
    "rule": "Первый подраздел — трёхзначный цифровой код характера сделки по классификатору характера сделки (например, «010» — перемещение на возмездной основе по договору купли-продажи). Второй подраздел — двузначный цифровой код особенности внешнеэкономической сделки (например, «06» — если исходя из суммы сделки на неё не распространяется требование о постановке контракта на учёт в банке). Третий подраздел не заполняется.",
    "related": "Влияет на выбор метода определения таможенной стоимости (графа 43).",
    "links": [
      {
        "label": "Классификатор характера сделки",
        "url": "https://www.alta.ru/tamdoc/07pr1003/#a04"
      },
      {
        "label": "Классификатор особенностей внешнеэкономической сделки",
        "url": "https://www.alta.ru/tamdoc/07pr1003/#a05"
      }
    ],
    "controls": [
      {
        "key": "g24-code",
        "type": "text",
        "placeholder": "000",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g24-feature",
        "type": "text",
        "placeholder": "00",
        "disabled": false,
        "className": "code xshort",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g24-unused",
        "type": "text",
        "placeholder": "не заполняется",
        "disabled": true,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-34",
    "graph": "25",
    "label": "Вид транспорта на границе",
    "required": true,
    "rule": "Код вида транспорта, на котором товар пересекает границу.",
    "related": "Согласуется с графами 18/21 (те — про конкретное ТС, эта — про вид транспорта).",
    "links": [
      {
        "label": "Классификатор видов транспорта (Прил. 3)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril3"
      }
    ],
    "controls": [
      {
        "key": "g25-mode",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-35",
    "graph": "26",
    "label": "Вид транспорта внутри страны",
    "required": false,
    "rule": "Код вида транспорта, которым товар перевозится внутри страны после границы.",
    "related": "",
    "links": [
      {
        "label": "Классификатор видов транспорта (Прил. 3)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril3"
      }
    ],
    "controls": [
      {
        "key": "g26-mode",
        "type": "text",
        "placeholder": "код",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-36",
    "graph": "27",
    "label": "Место погрузки / разгрузки",
    "required": false,
    "rule": "Графа не заполняется декларантом.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g27-unused",
        "type": "text",
        "placeholder": "не заполняется декларантом",
        "disabled": true,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-37",
    "graph": "28",
    "label": "Финансовые и банковские сведения",
    "required": false,
    "rule": "Графа не заполняется декларантом.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g28-unused",
        "type": "text",
        "placeholder": "не заполняется декларантом",
        "disabled": true,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-38",
    "graph": "29",
    "label": "Орган въезда / выезда",
    "required": true,
    "rule": "Код таможенного органа на границе, через который товар въезжает/выезжает.",
    "related": "",
    "links": [
      {
        "label": "Реестр таможенных органов",
        "url": "https://www.alta.ru/tam/"
      }
    ],
    "controls": [
      {
        "key": "g29-office",
        "type": "text",
        "placeholder": "код таможенного поста",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-39",
    "graph": "30",
    "label": "Местонахождение товаров",
    "required": true,
    "rule": "Место фактического нахождения товара для целей таможенного контроля.",
    "related": "",
    "links": [
      {
        "label": "Классификатор мест нахождения товаров (Прил. 24)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril24"
      }
    ],
    "controls": [
      {
        "key": "g30-location",
        "type": "text",
        "placeholder": "код места / адрес",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-40",
    "graph": "31",
    "label": "Грузовые места и описание товаров",
    "required": true,
    "rule": "Маркировка и номера грузовых мест, количество и вид упаковки, коммерческое наименование товара с характеристиками для классификации по ТН ВЭД.",
    "related": "Кол-во и вид мест — из упаковочного листа; наименование — из инвойса/контракта. Сумма мест по товарам = графа 6.",
    "links": [
      {
        "label": "Классификатор видов груза и упаковки (Прил. 12)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril12"
      }
    ],
    "controls": [
      {
        "key": "g31-desc",
        "type": "textarea",
        "placeholder": "маркировка, кол-во и вид мест, описание товара",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-41",
    "graph": "32",
    "label": "Товар №",
    "required": true,
    "rule": "Порядковый номер товара в декларации.",
    "related": "Не превышает графу 5.",
    "links": [],
    "controls": [
      {
        "key": "g32-num",
        "type": "text",
        "placeholder": "1",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-42",
    "graph": "33",
    "label": "Код товара",
    "required": true,
    "rule": "Первый подраздел — без пробелов десятизначный классификационный код товара по ТН ВЭД ЕАЭС. Второй подраздел — буквенное обозначение («М», «О» и др.). Третий подраздел — без пробелов четыре знака кода по классификатору дополнительной таможенной информации, если этот классификатор содержит код ТН ВЭД, указанный в первом подразделе.",
    "related": "Определяет ставки в графе 47 и применимость преференции (36).",
    "links": [
      {
        "label": "ТН ВЭД ЕАЭС",
        "url": "https://www.alta.ru/tnved/"
      },
      {
        "label": "Классификатор дополнительной таможенной информации",
        "url": "https://www.alta.ru/tamdoc/07pr1003/#a024"
      }
    ],
    "controls": [
      {
        "key": "g33-tnved",
        "type": "text",
        "placeholder": "10 знаков ТН ВЭД",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": true
      },
      {
        "key": "g33-intellectual",
        "type": "text",
        "placeholder": "М/О",
        "disabled": false,
        "className": "code xshort",
        "rows": 2,
        "goods": true
      },
      {
        "key": "g33-additional",
        "type": "text",
        "placeholder": "0000",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-43",
    "graph": "34",
    "label": "Код страны происхождения",
    "required": true,
    "rule": "Код страны происхождения конкретного товара.",
    "related": "Если графа 16 = конкретная страна — дублирует её; если «РАЗНЫЕ» — своя страна на товар.",
    "links": [
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "g34-origin",
        "type": "text",
        "placeholder": "код страны",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-44",
    "graph": "35",
    "label": "Вес брутто (кг)",
    "required": true,
    "rule": "Вес товара с учётом всех видов упаковки (брутто), в кг.",
    "related": "Не противоречит транспортному документу.",
    "links": [],
    "controls": [
      {
        "key": "g35-gross",
        "type": "text",
        "placeholder": "кг",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-45",
    "graph": "36",
    "label": "Преференция",
    "required": false,
    "rule": "Код тарифной льготы/преференции, применяемой к товару.",
    "related": "Зависит от кода ТН ВЭД (33) и страны происхождения (34).",
    "links": [
      {
        "label": "Классификатор льгот по уплате платежей (Прил. 7)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril7"
      }
    ],
    "controls": [
      {
        "key": "g36-preference",
        "type": "text",
        "placeholder": "код льготы",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-46",
    "graph": "37",
    "label": "Процедура",
    "required": true,
    "rule": "Код заявляемой процедуры / код предшествующей процедуры («00», если её не было) + код особенности перемещения (Прил. 2).",
    "related": "Первые цифры равны 2-му подразделу графы 1.",
    "links": [
      {
        "label": "Классификатор видов процедур (Прил. 1)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril1"
      },
      {
        "label": "Классификатор особенностей перемещения (Прил. 2)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril2"
      }
    ],
    "controls": [
      {
        "key": "g37-procedure",
        "type": "text",
        "placeholder": "00/00",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": true
      },
      {
        "key": "g37-movement",
        "type": "text",
        "placeholder": "000",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-47",
    "graph": "38",
    "label": "Вес нетто (кг)",
    "required": true,
    "rule": "Вес товара без упаковки (нетто), в кг.",
    "related": "Не может превышать графу 35.",
    "links": [],
    "controls": [
      {
        "key": "g38-net",
        "type": "text",
        "placeholder": "кг",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-48",
    "graph": "39",
    "label": "Квота",
    "required": false,
    "rule": "Заполняется только если товар подпадает под квоту.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g39-quota",
        "type": "text",
        "placeholder": "если применимо",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-49",
    "graph": "40",
    "label": "Общая декларация / предшествующий документ",
    "required": false,
    "rule": "Номер предшествующего документа: транзитной декларации, декларации на временное хранение и т. п.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g40-previous",
        "type": "text",
        "placeholder": "№ документа",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-50",
    "graph": "41",
    "label": "Доп. единица измерения",
    "required": false,
    "rule": "Код доп. единицы измерения и количество в этой единице, если предусмотрена для кода ТН ВЭД.",
    "related": "",
    "links": [
      {
        "label": "Классификатор единиц измерения (Прил. 15)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril15"
      }
    ],
    "controls": [
      {
        "key": "g41-unit",
        "type": "text",
        "placeholder": "ед.",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": true
      },
      {
        "key": "g41-quantity",
        "type": "text",
        "placeholder": "кол-во",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-51",
    "graph": "42",
    "label": "Цена товара",
    "required": true,
    "rule": "Стоимость товара по счёту (инвойсу) в валюте графы 22.",
    "related": "Сумма по всем товарам равна графе 22.",
    "links": [],
    "controls": [
      {
        "key": "g42-amount",
        "type": "text",
        "placeholder": "цена по счёту",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-52",
    "graph": "43",
    "label": "Код МОС",
    "required": false,
    "rule": "Код метода определения таможенной стоимости (1–6).",
    "related": "Связан с характером сделки (24) и расчётом графы 45.",
    "links": [
      {
        "label": "Классификатор методов определения ТС (Прил. 4)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril4"
      }
    ],
    "controls": [
      {
        "key": "g43-method",
        "type": "text",
        "placeholder": "метод 1–6",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-53",
    "graph": "44",
    "label": "Дополнительная информация / представленные документы",
    "required": true,
    "rule": "Перечень документов, на основании которых заполнена декларация: код вида документа + номер + дата.",
    "related": "Собирается автоматически по загруженным контракту, инвойсу, упаковочному листу и транспортной накладной.",
    "links": [
      {
        "label": "Классификатор видов документов и сведений (Прил. 8)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril8"
      }
    ],
    "controls": [
      {
        "key": "g44-documents",
        "type": "textarea",
        "placeholder": "список документов (код, номер, дата) — заполняется автоматически",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-54",
    "graph": "45",
    "label": "Таможенная стоимость",
    "required": true,
    "rule": "Таможенная стоимость товара, рассчитанная выбранным методом (обычно — цена по инвойсу с учётом условий поставки, гр. 20).",
    "related": "Сумма по товарам = графа 12.",
    "links": [],
    "controls": [
      {
        "key": "g45-cval",
        "type": "text",
        "placeholder": "расчёт",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-55",
    "graph": "46",
    "label": "Статистическая стоимость",
    "required": true,
    "rule": "Таможенная стоимость в пересчёте на статистические условия поставки.",
    "related": "Рассчитывается с учётом графы 20.",
    "links": [],
    "controls": [
      {
        "key": "g46-statistical",
        "type": "text",
        "placeholder": "расчёт",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-56",
    "graph": "48",
    "label": "Отсрочка платежей",
    "required": false,
    "rule": "Заполняется только при отсрочке/рассрочке уплаты таможенных платежей. Это не условия оплаты по контракту.",
    "related": "",
    "links": [
      {
        "label": "Классификатор особенностей уплаты платежей (Прил. 10)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril10"
      }
    ],
    "controls": [
      {
        "key": "g48-deferral",
        "type": "text",
        "placeholder": "код и срок, если применяется",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-57",
    "graph": "47",
    "label": "Исчисление платежей",
    "required": false,
    "rule": "Таблица расчёта таможенных платежей по товару: вид платежа, основа начисления, ставка, сумма, способ уплаты (СП).",
    "related": "Опирается на графы 33, 36, 45.",
    "links": [
      {
        "label": "Классификатор видов налогов и платежей (Прил. 9)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril9"
      },
      {
        "label": "Классификатор способов уплаты платежей (Прил. 11)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril11"
      }
    ],
    "controls": [
      {
        "key": "g47-payments",
        "type": "textarea",
        "placeholder": "вид / основа начисления / ставка / сумма / СП — рассчитывается автоматически",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": true
      }
    ]
  },
  {
    "id": "field-58",
    "graph": "B",
    "label": "Подробности подсчёта",
    "required": false,
    "rule": "Суммы таможенных платежей и иных платежей, взимание которых возложено на таможенные органы, за все товары ДТ. Сведения по каждому виду платежа указываются отдельной строкой (строками) в разрезе документов, подтверждающих уплату. Все элементы разделяются знаком тире «–», пробелы между элементами не допускаются, сумма округляется по математическим правилам до двух знаков после запятой. Схема строки: 1) код вида платежа по классификатору видов налогов, сборов и иных платежей; 2) сумма уплаченного платежа; 3) цифровой код валюты уплаты по классификатору валют; 4) номер документа, подтверждающего (отражающего) уплату; 5) дата этого документа (ДД.ММ.ГГГГ); 6) способ уплаты по классификатору способов уплаты; 7) налоговый номер лица, уплатившего платёж или за счёт средств которого он взыскан. Налоговый номер — это ИНН, а для юридического лица также КПП (для обособленного подразделения — КПП по месту его нахождения); в бумажной ДТ они разделяются знаком «/», в электронной вносятся в соответствующие реквизиты структуры ДТ. Особенности элемента 7: для лица, поставленного на учёт в налоговом органе другого государства – члена Союза, перед налоговым номером без пробелов указывается код страны (региона или части страны) по классификатору стран мира, в которой лицо поставлено на налоговый учёт; для иностранной организации, не поставленной на учёт в налоговом органе РФ, — без пробелов код страны регистрации и присвоенный ей в стране регистрации регистрационный номер либо код налогоплательщика или его аналог; для физического лица, не являющегося ИП и не поставленного на учёт в налоговом органе РФ, — сведения о документе, удостоверяющем личность (по пункту 143 Порядка). Если платёж уплачен после регистрации ДТ, элементы 4–7 вносятся уполномоченным лицом в порядке, установленном Решением Коллегии ЕЭК от 10.12.2013 № 289, на основании представленных документов об уплате.",
    "related": "Суммы должны соответствовать итогам расчётов по графам 47 всех товаров декларации.",
    "links": [
      {
        "label": "Классификатор видов налогов, сборов и иных платежей (Прил. 9)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril9"
      },
      {
        "label": "Классификатор способов уплаты платежей (Прил. 11)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril11"
      },
      {
        "label": "Классификатор валют (Прил. 23)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril23"
      },
      {
        "label": "Классификатор стран мира, ОКСМ (Прил. 22)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril22"
      }
    ],
    "controls": [
      {
        "key": "gB-payments",
        "type": "textarea",
        "placeholder": "код платежа–сумма–код валюты–№ документа–дата–способ уплаты–налоговый номер (каждый вид платежа с новой строки)",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-59",
    "graph": "49",
    "label": "Реквизиты склада",
    "required": false,
    "rule": "Код и наименование склада временного хранения / таможенного склада, если товар там размещается.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g49-warehouse",
        "type": "text",
        "placeholder": "код и наименование склада",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-60",
    "graph": "51",
    "label": "Предполагаемые органы (и страна) транзита",
    "required": false,
    "rule": "Заполняется, только если товар далее проследует транзитом.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g51-transit",
        "type": "text",
        "placeholder": "только для транзита",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-61",
    "graph": "53",
    "label": "Орган (и страна) назначения",
    "required": false,
    "rule": "Заполняется при использовании процедуры транзита.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g53-destination",
        "type": "text",
        "placeholder": "только для транзита",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-62",
    "graph": "54",
    "label": "Св-во таможенного представителя",
    "required": false,
    "rule": "Номер и дата свидетельства о включении в реестр таможенных представителей. Заполняется, только если ДТ подаётся таможенным представителем.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-certificate-number",
        "type": "text",
        "placeholder": "Номер",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-certificate-date",
        "type": "text",
        "placeholder": "Дата",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-63",
    "graph": "54",
    "label": "ИНН / КПП там. представителя",
    "required": false,
    "rule": "ИНН и КПП таможенного представителя.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-inn",
        "type": "text",
        "placeholder": "ИНН/КПП",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-64",
    "graph": "54",
    "label": "Договор таможенного представителя с клиентом",
    "required": false,
    "rule": "Номер и дата договора таможенного представителя с клиентом (декларантом).",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-contract-number",
        "type": "text",
        "placeholder": "Номер",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-contract-date",
        "type": "text",
        "placeholder": "Дата",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-65",
    "graph": "54",
    "label": "Декларант",
    "required": true,
    "rule": "Фамилия, имя, отчество физического лица, подающего декларацию.",
    "related": "Согласуется с графой 14.",
    "links": [],
    "controls": [
      {
        "key": "g54-surname",
        "type": "text",
        "placeholder": "Фамилия",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-firstname",
        "type": "text",
        "placeholder": "Имя",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-patronymic",
        "type": "text",
        "placeholder": "Отчество",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-66",
    "graph": "54",
    "label": "Телефон",
    "required": false,
    "rule": "Контактный телефон декларанта.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-phone",
        "type": "text",
        "placeholder": "телефон",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-67",
    "graph": "54",
    "label": "Должность",
    "required": false,
    "rule": "Должность лица, подающего декларацию.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-position",
        "type": "text",
        "placeholder": "должность",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-68",
    "graph": "54",
    "label": "Документ, удостоверяющий личность",
    "required": true,
    "rule": "Код вида документа, удостоверяющего личность, его краткое наименование, серия, номер и дата выдачи.",
    "related": "",
    "links": [
      {
        "label": "Классификатор видов документов и сведений (Прил. 8)",
        "url": "https://www.alta.ru/tamdoc/10sr0378/#pril8"
      }
    ],
    "controls": [
      {
        "key": "g54-identity-code",
        "type": "text",
        "placeholder": "Код",
        "disabled": false,
        "className": "code xshort",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-identity-name",
        "type": "text",
        "placeholder": "Краткое наим.",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-identity-series",
        "type": "text",
        "placeholder": "Серия",
        "disabled": false,
        "className": "code xshort",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-identity-number",
        "type": "text",
        "placeholder": "Номер",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-identity-date",
        "type": "text",
        "placeholder": "дата",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-69",
    "graph": "54",
    "label": "Кем выдано удостоверение личности",
    "required": true,
    "rule": "Наименование органа, выдавшего документ, удостоверяющий личность.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-identity-issuer",
        "type": "text",
        "placeholder": "кем выдан",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-70",
    "graph": "54",
    "label": "Документ, подтверждающий полномочия декларанта",
    "required": true,
    "rule": "Документ, подтверждающий полномочия декларанта (доверенность, приказ, машиночитаемая доверенность): наименование, номер, срок действия «от» и «до».",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-authority-name",
        "type": "text",
        "placeholder": "Наименование",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-authority-number",
        "type": "text",
        "placeholder": "№",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-authority-from",
        "type": "text",
        "placeholder": "дата",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      },
      {
        "key": "g54-authority-to",
        "type": "text",
        "placeholder": "дата",
        "disabled": false,
        "className": "code short",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-71",
    "graph": "54",
    "label": "Печатная форма",
    "required": false,
    "rule": "Печатная форма графы 54 — итоговый текст, который выводится в печатной декларации. Формируется автоматически из полей слева.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-print",
        "type": "textarea",
        "placeholder": "формируется автоматически из полей слева",
        "disabled": false,
        "className": "",
        "rows": 12,
        "goods": false
      }
    ]
  },
  {
    "id": "field-72",
    "graph": "54",
    "label": "Место заполнения",
    "required": true,
    "rule": "Место (населённый пункт) составления декларации.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-place",
        "type": "text",
        "placeholder": "город",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-73",
    "graph": "54",
    "label": "Дата подачи",
    "required": true,
    "rule": "Дата подачи декларации в таможенный орган.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-submitted",
        "type": "text",
        "placeholder": "дд.мм.гггг",
        "disabled": false,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-74",
    "graph": "54",
    "label": "Дата регистрации",
    "required": false,
    "rule": "Дата регистрации декларации таможенным органом — проставляется таможней.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-registered",
        "type": "text",
        "placeholder": "заполняет таможня",
        "disabled": true,
        "className": "code",
        "rows": 2,
        "goods": false
      }
    ]
  },
  {
    "id": "field-75",
    "graph": "54",
    "label": "Номер и дата акта (для отчёта таможенного представителя)",
    "required": false,
    "rule": "Номер и дата акта — для отчёта таможенного представителя.",
    "related": "",
    "links": [],
    "controls": [
      {
        "key": "g54-act",
        "type": "text",
        "placeholder": "номер и дата акта",
        "disabled": false,
        "className": "",
        "rows": 2,
        "goods": false
      }
    ]
  }
]
export const declarationSections: DeclarationSection[] = [
  {
    "id": "section-1",
    "title": "2Отправитель / Экспортёр",
    "fields": [
      "field-1",
      "field-2",
      "field-3",
      "field-4"
    ]
  },
  {
    "id": "section-2",
    "title": "Общие сведения о декларации",
    "fields": [
      "field-5",
      "field-6",
      "field-7",
      "field-8",
      "field-9",
      "field-10"
    ]
  },
  {
    "id": "section-3",
    "title": "8Получатель",
    "fields": [
      "field-11",
      "field-12",
      "field-13",
      "field-14"
    ]
  },
  {
    "id": "section-4",
    "title": "Финансовые сведения",
    "fields": [
      "field-15",
      "field-16",
      "field-17",
      "field-18",
      "field-19"
    ]
  },
  {
    "id": "section-5",
    "title": "14Декларант",
    "fields": [
      "field-20",
      "field-21",
      "field-22",
      "field-23"
    ]
  },
  {
    "id": "section-6",
    "title": "Страны отправления / происхождения / назначения",
    "fields": [
      "field-24",
      "field-25",
      "field-26"
    ]
  },
  {
    "id": "section-7",
    "title": "Транспорт и условия поставки",
    "fields": [
      "field-27",
      "field-28",
      "field-29",
      "field-30",
      "field-31",
      "field-32",
      "field-33",
      "field-34",
      "field-35",
      "field-36",
      "field-37",
      "field-38",
      "field-39"
    ]
  },
  {
    "id": "section-8",
    "title": "Товары",
    "fields": [
      "field-40",
      "field-41",
      "field-42",
      "field-43",
      "field-44",
      "field-45",
      "field-46",
      "field-47",
      "field-48",
      "field-49",
      "field-50",
      "field-51",
      "field-52",
      "field-53",
      "field-54",
      "field-55",
      "field-56",
      "field-57",
      "field-58"
    ]
  },
  {
    "id": "section-9",
    "title": "Служебная информация",
    "fields": [
      "field-59",
      "field-60",
      "field-61"
    ]
  },
  {
    "id": "section-10",
    "title": "54Место и дата · сведения о декларанте и таможенном представителе",
    "fields": [
      "field-62",
      "field-63",
      "field-64",
      "field-65",
      "field-66",
      "field-67",
      "field-68",
      "field-69",
      "field-70",
      "field-71",
      "field-72",
      "field-73",
      "field-74",
      "field-75"
    ]
  }
]
export const checkboxControls = [
  {
    "key": "g2-same",
    "type": "checkbox",
    "disabled": false,
    "goods": false
  },
  {
    "key": "g2-contragent",
    "type": "checkbox",
    "disabled": false,
    "goods": false
  },
  {
    "key": "g8-same",
    "type": "checkbox",
    "disabled": false,
    "goods": false
  },
  {
    "key": "g8-contragent",
    "type": "checkbox",
    "disabled": false,
    "goods": false
  }
] as const
export const goodsControlKeys = new Set(declarationFields.flatMap(field => field.controls.filter(control => control.goods).map(control => control.key)))
export const allDeclarationControls = [...declarationFields.flatMap(field => field.controls), ...checkboxControls]
