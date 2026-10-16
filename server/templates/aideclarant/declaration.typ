#set page(paper: "a4", margin: (x: 10mm, y: 10mm), numbering: "1 / 1")
#set text(font: ("Arial", "Noto Sans", "New Computer Modern"), size: 8pt, fill: rgb("#1B2333"))
#set par(leading: 0.45em)
#let data = json(sys.inputs.at("data", default: "declaration-data.json"))
#let line = rgb("#D9DCE3")
#let entry(control) = block(width: 100%, breakable: true)[
  #if control.label != "" { text(size: 6pt, fill: rgb("#65708A"))[#control.label]; linebreak() }
  #block(width: 100%, inset: 4pt, stroke: 0.5pt + line, fill: if control.disabled { rgb("#F1F2F4") } else { white }, breakable: true)[#if control.value == "" { v(6pt) } else { control.value }]
]
#let field(item) = block(width: 100%, breakable: item.controls.any(control => control.value.len() > 1200))[
  #text(weight: "semibold", size: 7pt)[#item.label]
  #v(3pt)
  #grid(columns: (1fr,) * item.controls.len(), gutter: 4pt, ..item.controls.map(entry))
]
#align(center)[#text(size: 15pt, weight: "bold")[#data.title]]
#v(8pt)
#for section in data.sections {
  block(width: 100%, breakable: true, above: 7pt, below: 4pt)[
    #block(width: 100%, inset: 7pt, sticky: true, fill: rgb("#F3F0E8"), stroke: 0.5pt + line)[#text(size: 10pt, weight: "bold")[#section.title]]
    #for option in section.checkboxes {
      block(above: 4pt, below: 3pt)[#box(width: 9pt, height: 9pt, stroke: 0.7pt, inset: 0pt, baseline: 20%)[#align(center + horizon)[#if option.checked { text(size: 8pt, weight: "bold")[×] }]] #option.label]
    }
    #v(5pt)
    #let cells = {
      let result = ()
      let column = 0
      for item in section.fields {
        if item.wide {
          if column == 1 { result.push([]) }
          result.push(grid.cell(colspan: 2)[#field(item)])
          column = 0
        } else {
          result.push(field(item))
          column = 1 - column
        }
      }
      result
    }
    #grid(columns: (1fr, 1fr), column-gutter: 8pt, row-gutter: 7pt, ..cells)
  ]
}
