#let data = json(bytes(sys.inputs.payload))

#set page(margin: (top: 3cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm))
#set text(font: "New Computer Modern", size: 11pt, lang: "en")
#set par(justify: true, leading: 0.8em)

// --- Header ---
#align(right)[
  #text(size: 9pt, fill: luma(120))[
    #data.entreprise.nom \
    #data.entreprise.adresse \
    #data.entreprise.email
  ]
]

#v(1.5cm)

#align(center)[
  #text(size: 8pt, fill: luma(100), tracking: 0.15em, weight: "bold")[TECHNICAL RESPONSE]
  #v(0.3cm)
  #text(size: 18pt, weight: "bold")[#data.marche.titre]
  #v(0.1cm)
  #text(size: 13pt, fill: luma(80))[#data.marche.sousTitre]
]

#v(0.8cm)

#grid(
  columns: (1fr, 1fr),
  align: (left, right),
  text(size: 9pt, fill: luma(100))[
    *Company:* #data.entreprise.nom \
    *Contact:* #data.entreprise.contact
  ],
  text(size: 9pt, fill: luma(100))[
    *Date:* #data.marche.date \
    *Tender reference:* #data.marche.reference
  ],
)

#v(0.5cm)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.5cm)

// --- Dynamic sections ---
#for section in data.sections [
  #text(size: 13pt, weight: "bold")[#section.titre]
  #v(0.3cm)

  #for para in section.contenu.split("\n\n") [
    #if para.starts-with("- ") [
      #for item in para.split("\n") [
        #if item.starts-with("- ") [
          - #item.slice(2)
        ]
      ]
    ] else [
      #para
    ]
    #v(0.3em)
  ]

  #v(0.4cm)
]

// --- Footer ---
#v(1fr)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(0.2cm)
#text(size: 8pt, fill: luma(150))[
  #data.entreprise.nom — Confidential document
]
