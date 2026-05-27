import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Saksham Gupta",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    // Set SITE_URL to the custom domain when deploying, without https://.
    baseUrl: process.env.SITE_URL ?? "localhost:8080",
    ignorePatterns: ["private", "templates", ".obsidian", "**/.DS_Store"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#fcfbf8",
          lightgray: "#ebe8e1",
          gray: "#aaa49a",
          darkgray: "#514d47",
          dark: "#22201d",
          secondary: "#52758a",
          tertiary: "#6c96ac",
          highlight: "rgba(108, 150, 172, 0.12)",
          textHighlight: "#eadc9a66",
        },
        darkMode: {
          light: "#181716",
          lightgray: "#302e2b",
          gray: "#716d67",
          darkgray: "#c7c2b9",
          dark: "#eee9df",
          secondary: "#8bb1c5",
          tertiary: "#a8cad8",
          highlight: "rgba(139, 177, 197, 0.14)",
          textHighlight: "#ad934055",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    // A note must explicitly opt into the public site.
    filters: [Plugin.ExplicitPublish()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Enable CustomOgImages after SITE_URL and final portrait/branding are set.
    ],
  },
}

export default config
