import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { simplifySlug } from "../util/path"
// @ts-ignore
import menuScript from "./scripts/siteNav.inline"

interface Options {
  links: Record<string, string>
}

export default (({ links }: Options) => {
  const SiteNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const currentPage = `/${simplifySlug(fileData.slug!)}`
    const renderLinks = () =>
      Object.entries(links).map(([title, href]) => (
        <a href={href} aria-current={href === currentPage ? "page" : undefined}>
          {title}
        </a>
      ))

    return (
      <nav class={classNames(displayClass, "site-nav")} aria-label="Site navigation">
        <div class="site-nav-links">{renderLinks()}</div>
        <details class="site-nav-menu">
          <summary aria-label="Menu" title="Menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div class="site-nav-panel">{renderLinks()}</div>
        </details>
      </nav>
    )
  }

  SiteNav.afterDOMLoaded = menuScript
  SiteNav.css = `
.site-nav {
  align-items: center;
  display: flex;
}

.site-nav-links {
  align-items: center;
  display: flex;
  gap: 1.5rem;
}

.site-nav a {
  color: var(--darkgray);
  font-size: 0.9rem;
  font-weight: 400;
}

.site-nav a:hover,
.site-nav a[aria-current="page"] {
  color: var(--secondary);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.site-nav-menu {
  display: none;
  position: relative;
}

.site-nav-menu summary {
  align-items: center;
  color: var(--darkgray);
  cursor: pointer;
  display: flex;
  height: 44px;
  justify-content: center;
  list-style: none;
  touch-action: manipulation;
  width: 44px;
}

.site-nav-menu summary::-webkit-details-marker {
  display: none;
}

.site-nav-panel {
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
  inset-inline-end: 0;
  min-width: 10rem;
  padding: 0.3rem 0.45rem;
  position: absolute;
  top: calc(100% + 0.45rem);
  z-index: 2;
}

.site-nav-panel a {
  align-items: center;
  display: flex;
  min-height: 44px;
  padding: 0 0.65rem;
  touch-action: manipulation;
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

  return SiteNav
}) satisfies QuartzComponentConstructor<Options>
