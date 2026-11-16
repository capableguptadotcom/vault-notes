# Saksham Gupta’s website

[capablegupta.com](https://capablegupta.com) is a Quartz 4 site. Quartz Syncer sends public notes from the **Akshara** Obsidian vault to GitHub, and GitHub Pages deploys changes pushed to `main`.

## Publish and unpublish

1. In Akshara, put the note in `capablegupta/notes/`, `capablegupta/writing/`, or `capablegupta/clippings/`.
2. Turn on the `publish` checkbox in the note’s Properties. Edits to published notes sync automatically too.
3. Keep Obsidian desktop open. Quartz Syncer checks every minute, then GitHub Pages builds and deploys the change.

Turn off `publish` to remove the public page on the next successful deployment. The note stays in Obsidian.

- Review the note’s text, properties, and embedded files before publishing. Keep private material and templates outside `capablegupta/`. Earlier versions can remain in public Git history after unpublishing.
- If a change stalls, check the timer and GitHub token in Quartz Syncer, then check the [GitHub Pages deployment](https://github.com/capableguptadotcom/vault-notes/actions/workflows/deploy-pages.yml).

## Quartz Syncer settings

| Setting                      | Value                                                   |
| ---------------------------- | ------------------------------------------------------- |
| Publish target               | Remote                                                  |
| Remote URL                   | `https://github.com/capableguptadotcom/vault-notes.git` |
| Branch                       | `main`                                                  |
| Vault root folder            | `capablegupta`                                          |
| Destination content folder   | `published-notes`                                       |
| Publish property             | `publish`                                               |
| Include all notes by default | Off                                                     |
| Auto-publish interval        | 1 minute                                                |

Use **Username & token/password** authentication with `capableguptadotcom`. Save a fine-grained GitHub token scoped to `vault-notes` with **Contents → Read and write** in Quartz Syncer’s **Access token** setting.

Keep the destination set to `published-notes`. Quartz Syncer can delete files in that folder when it can’t match them to a published note. The homepage and the three section landing pages live in [`content/`](content/) and take precedence during the build.

The same setup works with another vault. Use that vault’s public folder and a dedicated publishing destination. Keep one source vault per destination so automatic cleanup can tell which notes belong there.

## Build locally

Use Node.js 22+ and npm 10.9.2+.

```sh
npm ci
npm run build:github
```

The build writes the site to `public/`. For a live preview from Obsidian, open Akshara and run `npm run dev:vault`.
