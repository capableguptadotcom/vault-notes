document.addEventListener("click", (event) => {
  const menu = document.querySelector<HTMLDetailsElement>(".site-nav-menu[open]")
  const target = event.target
  if (menu && target instanceof Element && (!menu.contains(target) || target.closest("a"))) {
    menu.open = false
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return
  const menu = document.querySelector<HTMLDetailsElement>(".site-nav-menu[open]")
  if (!menu) return

  menu.open = false
  menu.querySelector("summary")?.focus()
})
