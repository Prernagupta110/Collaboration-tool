// The project function defines how your document looks.
// It takes your content and some metadata and formats it.
// Go ahead and customize it to your liking!
#let project(title: "", subtitle: "", authors: (), body) = {
  // Set the document's basic properties.
  set document(author: authors.at(0).name, title: title)
  set page(numbering: "1", number-align: center)
  set text(font: "New Computer Modern", lang: "en", hyphenate: false)

  // Title row.
  pad(
    bottom: 0em,
    align(center)[
      #block(text(weight: 700, 1.75em, title), width: 32em)
      #block(text(weight: 700, 1.15em, subtitle))
    ]
  )
  
  place(
    top + left,
    image("logo.png", width: 13%),
    dx: -1em,
    dy: -1em,
  )

  // Author information.
  pad(
    top: 1em,
    bottom: 0.5em,
    x: 2em,
    grid(
      columns: (1fr,) * calc.min(3, authors.len()),
      gutter: 1em,
      ..authors.map(author => align(left, 
        block(align(center, 
          strong(author.name)
          + "\n" + author.email
        ))
      )),
    ),
  )
  line(length: 100%, stroke: 0.5pt)

  set par(justify: true)

  body
}
