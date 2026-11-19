import { ComponentChildren } from "preact"
import { QuartzPluginData } from "../../plugins/vfile"
import { unescapeHTML } from "../../util/escape"
import { htmlToJsx } from "../../util/jsx"
import { resolveRelative } from "../../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const recentSections = [
  { folder: "writing", title: "Recent writing" },
  { folder: "clippings", title: "Recent reading" },
]

function publicationTime(page: QuartzPluginData): number {
  const date = page.frontmatter?.published ? page.dates?.published : page.dates?.created
  return date?.getTime() ?? 0
}

const Content: QuartzComponent = ({ fileData, tree, allFiles }: QuartzComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  const slug = fileData.slug!

  if (slug === "index") {
    return (
      <article class={`${classString} home-split`}>
        <div class="home-intro" id="about">
          {content}
        </div>
        <div class="home-recent">
          {recentSections.map(({ folder, title }) => {
            const recent = allFiles
              .filter(
                (page) => page.slug?.startsWith(`${folder}/`) && !page.slug.endsWith("/index"),
              )
              .sort((a, b) => publicationTime(b) - publicationTime(a))
              .slice(0, 3)

            return (
              <section aria-labelledby={`recent-${folder}`}>
                <h2 id={`recent-${folder}`}>
                  <a href={`/${folder}/`}>{title}</a>
                </h2>
                {recent.length > 0 && (
                  <ul>
                    {recent.map((page) => {
                      const description =
                        page.frontmatter?.description ?? unescapeHTML(page.description ?? "")
                      return (
                        <li>
                          <a href={resolveRelative(slug, page.slug!)} class="internal">
                            {page.frontmatter?.title}
                          </a>
                          {description && <p>{description}</p>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </article>
    )
  }

  return <article class={classString}>{content}</article>
}

export default (() => Content) satisfies QuartzComponentConstructor
