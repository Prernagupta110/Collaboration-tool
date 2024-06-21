#let dollarArrow = {
  /*
  define a function to draw 
  an arrow followed by a dollar sign,
  with the dollar sign being slightly 
  smaller than normal

  usedd to denote a random choice
  */
  let d = text("$", size: 0.8em)
  let a = $<-$
  [#a#h(-0.2em)#d#h(0.2em)]
}

#let customFunction(name, minW: 4cm, padding: 0.5cm, lines: 1) = style(styles => {
  /*
  underline a word/expression, 
  with exact length of underline 
  defined by min_w and padding.
  Amt of lines is defined by lines

  used for defining a function
  in pseudocode

  the function requires to retrieve the styles attr first:
  https://typst.app/docs/reference/layout/measure/
  */
  let w = measure(name, styles).width
  let fw
  if (w < minW) {
    fw = minW + padding - w
  }
  else {
    fw = padding
  }

  let inner = $underline(name#h(fw))$
  for i in range(1, lines) {
    inner = $underline(inner)$
  }
  return inner
})

#let longSymbol(sym, factor) = {
  assert(type(sym) == "symbol", message: "Input needs to be a symbol")
  assert(type(factor) == "integer" or type(factor) == "float", message: "Scale factor must be a number")
  assert(factor >= 1, message: "Scale factor must be >= 1")
  
  factor = 5*factor - 4
  let body = [#sym]
  style(styles => {
    let (body-w,body-h) = measure(body,styles).values()
    align(left)[
      #box(width: body-w*2/5,height: body-h,clip: true)[
        #align(left)[
          #body
        ]
      ]
      #h(0cm)
      #box(height: body-h, width: body-w*1/5*factor)[
        #scale(x: factor*100%,origin:left)[
          #box(height: body-h, width: body-w*1/5,clip:true)[
            #align(center)[
              #body
            ]
          ]
        ]
      ]
      #h(0cm)
      #box(width: body-w*2/5,clip: true)[
        #align(right)[
          #body
        ]
      ]
    ]
  })
}

#let rightLongArrow(text, sym: sym.arrow.r, factor: 8) = {
  return $attach(limits(longSymbol(sym, factor)), t: text)$
}
#let leftLongArrow(text, sym: sym.arrow.l, factor: 8) = {
  return $attach(limits(longSymbol(sym, factor)), t: text)$
}

// general shortcuts
#let pk = "pk"
#let sk = "sk"
#let keyGen = "PKE_KeyGen"
#let tokenGen = "TokenGen"
#let enc = "Enc"
#let dec = "Dec"

// indentation levels
#let hhh = $#h(2em)$
#let hspacebig = $#h(5em)$

#let comment(content) = {
  box(fill: rgb("#0066ff88"), inset: 5pt, radius: 4pt)[#content]
}
#let TODO(content) = {
  box(fill: rgb("#ff000088"), inset: 5pt, radius: 4pt)[#content]
}