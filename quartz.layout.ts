import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { QuartzComponentProps } from "./quartz/components/types"

const siteLinks = {
  Writing: "/writing/",
  Reading: "/reading/",
  About: "/about",
}

const siteHeader = [
  Component.PageTitle(),
  Component.SiteNav({ links: siteLinks }),
  Component.Flex({
    gap: "0",
    components: [{ Component: Component.Search() }, { Component: Component.Darkmode() }],
  }),
]

const isArticle = ({ fileData }: QuartzComponentProps) =>
  fileData.slug !== "index" && fileData.slug !== "about"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    copyright: "© 2026 Saksham Gupta",
    links: {
      Home: "/",
      ...siteLinks,
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: isArticle,
    }),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: isArticle,
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: isArticle,
    }),
    Component.ConditionalRender({
      component: Component.TagList(),
      condition: isArticle,
    }),
  ],
  left: siteHeader,
  right: [
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "You might want to explore",
        limit: 2,
        linkToMore: false,
        showTags: false,
        excludeCurrent: true,
        filter: (page) =>
          page.slug !== "index" && page.slug !== "about" && !page.slug?.endsWith("/index"),
      }),
      condition: isArticle,
    }),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: siteHeader,
  right: [],
}
