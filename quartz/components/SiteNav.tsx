import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const SiteNav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <nav class={classNames(displayClass, "site-nav")} aria-label="Site navigation">
      <a href="/#about">About</a>
      <a href="/notes/">Notes</a>
      <a href="/writing/">Writing</a>
      <a href="/clippings/">Clippings</a>
    </nav>
  )
}

SiteNav.css = `
.site-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-end;
  margin-left: auto;
}

.site-nav a {
  color: var(--gray);
  font-weight: 400;
}

.site-nav a:hover {
  color: var(--dark);
}
`

export default (() => SiteNav) satisfies QuartzComponentConstructor
