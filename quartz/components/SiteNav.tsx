import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const SiteNav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <nav class={classNames(displayClass, "site-nav")} aria-label="Site navigation">
      <div class="site-nav-links">
        <a href="/notes/">Notes</a>
        <a href="/writing/">Writing</a>
        <a href="/clippings/">Clippings</a>
      </div>
      <details class="site-nav-menu">
        <summary aria-label="Open site navigation">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </summary>
        <div class="site-nav-panel">
          <a href="/notes/">Notes</a>
          <a href="/writing/">Writing</a>
          <a href="/clippings/">Clippings</a>
          <a href="/#about">About</a>
        </div>
      </details>
    </nav>
  )
}

SiteNav.css = `
.site-nav {
  margin-left: auto;
  position: relative;
}

.site-nav-links {
  display: flex;
  gap: 1.5rem;
}

.site-nav a {
  color: var(--gray);
  font-weight: 400;
}

.site-nav a:hover {
  color: var(--dark);
}

.site-nav-menu {
  display: none;
  position: relative;
}

.site-nav-menu summary {
  align-items: center;
  color: var(--gray);
  cursor: pointer;
  display: flex;
  height: 1.8rem;
  justify-content: center;
  list-style: none;
  width: 1.8rem;
}

.site-nav-menu summary::-webkit-details-marker {
  display: none;
}

.site-nav-menu summary:hover {
  color: var(--dark);
}

.site-nav-panel {
  background: var(--light);
  border: 1px solid var(--lightgray);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  display: grid;
  gap: 0.7rem;
  min-width: 8.5rem;
  padding: 0.85rem 1rem;
  position: absolute;
  right: 0;
  top: 2.25rem;
  z-index: 2;
}

@media all and (max-width: 800px) {
  .site-nav-links {
    display: none;
  }

  .site-nav-menu {
    display: block;
  }
}
`

export default (() => SiteNav) satisfies QuartzComponentConstructor
