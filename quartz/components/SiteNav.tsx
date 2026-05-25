import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const SiteNav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <nav class={classNames(displayClass, "site-nav")} aria-label="Site navigation">
      <a href="/#about">About</a>
      <a href="/garden/Welcome">Now</a>
    </nav>
  )
}

SiteNav.css = `
.site-nav {
  display: flex;
  gap: 1.5rem;
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
