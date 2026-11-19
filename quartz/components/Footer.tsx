import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { simplifySlug } from "../util/path"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
  copyright?: string
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const links = opts?.links ?? {}
    const slug = simplifySlug(fileData.slug!)
    const currentPage = slug === "/" ? slug : `/${slug}`
    return (
      <footer class={`site-footer ${displayClass ?? ""}`}>
        {opts?.copyright && <p>{opts.copyright}</p>}
        <nav aria-label="Footer navigation">
          <ul>
            {Object.entries(links).map(([text, link]) => (
              <li>
                <a href={link} aria-current={link === currentPage ? "page" : undefined}>
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
