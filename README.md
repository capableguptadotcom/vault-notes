# Saksham Gupta

An Obsidian-first personal website for [capablegupta.com](https://capablegupta.com), built with [Quartz 4](https://quartz.jzhao.xyz/). It is designed to feel close to the Minimal theme: quiet typography, linked notes, technical writing, clippings, backlinks, search, and a light personal landing page.

## How publishing works

```text
Akshara -> capablegupta/ -> Quartz Syncer -> published-notes/ -> GitHub Pages -> capablegupta.com
```

- Put public notes in `capablegupta/notes/`, `capablegupta/writing/`, or `capablegupta/clippings/` and set `publish: true`.
- Quartz Syncer can send opted-in notes and their embedded media anywhere under its configured vault root. Keep private notes, private media, and publish-ready templates outside `capablegupta/` because the GitHub repository is public.
- The GitHub Pages build combines `published-notes/` with the landing pages in `content/` and applies `Plugin.ExplicitPublish()`.
- The local preview exporter uses the open vault and excludes `Template` and `Templates` folders. It assembles the export in a temporary build directory.

## Run locally

Requirements: Node.js 22+, npm 10.9+, and an Obsidian vault.

```powershell
npm ci
npm run publish
npm run dev:vault
```

Run `npm run build:github` to preview the checked-in GitHub content without opening the vault.

On Windows, `npm run publish` uses the open Obsidian vault registered in the Obsidian desktop app. To publish from another vault or from a server:

```powershell
$env:OBSIDIAN_VAULT = 'C:\path\to\your\vault'
$env:SITE_URL = 'capablegupta.com'
npm run publish
```

`SITE_URL` is the final hostname without `https://`; Quartz uses it for canonical URLs, RSS, and social metadata. GitHub Pages builds use `capablegupta.com`; local builds default to `localhost:8080`.

`npm run dev:vault` opens the local Quartz server and watches the Obsidian vault's `capablegupta/` public root. Saving a public-root note with `publish: true`, or changing one, automatically refreshes the exported pages used by the preview.

## Write in Obsidian

Place public notes in one of the approved folders under `capablegupta/` and add these properties:

```yaml
---
title: An idea worth publishing
publish: true
created: 2026-05-25
published: 2026-05-25
tags:
  - notes
---
```

Write normally after that. Wikilinks such as `[[Another published note]]`, tags, callouts, and embedded images are understood by Quartz. A link to a private note is not published; mark the linked note public too if it should resolve on the website.

The included templates in [obsidian-template/](obsidian-template/) cover notes, writing, and clippings. Use Obsidian's insert-template command to create publish-ready notes.

Public sections map from the private `capablegupta/` root to clean public URLs:

- `capablegupta/notes/Welcome.md` becomes `/notes/Welcome`.
- `capablegupta/writing/My Post.md` becomes `/writing/My-Post`.
- `capablegupta/clippings/Useful Article.md` becomes `/clippings/Useful-Article`.

The old `Garden/` source folder is retired. The local exporter reports a migration error for notes marked `publish: true` outside the three approved sections.

## Publish to GitHub Pages

Configure [Quartz Syncer](https://community.obsidian.md/plugins/quartz-syncer) in Akshara with these settings.

| Setting                      | Value                                                   |
| ---------------------------- | ------------------------------------------------------- |
| Publish target               | Remote                                                  |
| Remote URL                   | `https://github.com/capableguptadotcom/vault-notes.git` |
| Branch                       | `main`                                                  |
| Vault root folder            | `capablegupta`                                          |
| Destination content folder   | `published-notes`                                       |
| Publish property             | `publish`                                               |
| Include all notes by default | Off                                                     |

Store a repository-scoped GitHub token in the plugin's Access token setting. With a desktop auto-publish interval set, Quartz Syncer checks for changes while Obsidian is running. Set `publish: true` to publish a note or change it to `false` to remove it on the next run.

The destination must be `published-notes`. Quartz Syncer can delete unmatched files in that folder. The homepage and the three section landing pages live under `content/` and take precedence during the build.

`npm run publish:github` remains available for a manual export to the same `published-notes/` folder.

The workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) runs tests, builds Quartz with `SITE_URL=capablegupta.com`, and deploys the generated static site through GitHub Pages.

### Custom Domain

The public site is deployed at [https://capablegupta.com](https://capablegupta.com). GitHub Pages owns the custom domain configuration, domain ownership is verified, and HTTPS is enforced.

Cloudflare is configured with these DNS-only GitHub Pages records:

```text
A      @      185.199.108.153
A      @      185.199.109.153
A      @      185.199.110.153
A      @      185.199.111.153
CNAME  www    capableguptadotcom.github.io
```

Keep GitHub's `_github-pages-challenge-capableguptadotcom` TXT record in Cloudflare. It preserves domain verification and protects the domain from being claimed by another GitHub Pages site.

## Portrait and identity

The home page is [content/index.md](content/index.md). The optimized portrait is stored at `quartz/static/saksham-avatar.webp`; the original supplied illustration was tightly cropped so the face remains clear without dominating the minimal layout. `quartz/static/icon.png` uses a still tighter crop for the browser favicon.

The public identity is set to `Saksham Gupta`.

## Future VPS Hosting

GitHub Pages is the current deployment target. The `ops/` setup remains available for a later VPS migration. The `tingu-wiki` vault already has Obsidian's core Sync feature enabled, so a future VPS can use [Obsidian Headless Sync](https://obsidian.md/help/sync/headless), which currently requires an active Obsidian Sync subscription.

On a Node.js 22+ VPS, create a dedicated unprivileged site account and writable directories:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin personal-site
sudo mkdir -p /srv/obsidian/tingu-wiki /srv/personal-site /var/www/personal-site
sudo chown -R personal-site:personal-site /srv/obsidian /srv/personal-site /var/www/personal-site
sudo npm install -g obsidian-headless
```

Clone this site into `/srv/personal-site`, then authenticate and configure a pull-only vault mirror as the site account:

```bash
sudo -u personal-site -H ob login
sudo -u personal-site -H ob sync-setup --vault "tingu-wiki" --path /srv/obsidian/tingu-wiki --device-name personal-site-vps
sudo -u personal-site -H ob sync-config --path /srv/obsidian/tingu-wiki --mode pull-only
```

Replace `"tingu-wiki"` if the remote Obsidian Sync vault has a different name. Test one build before enabling automation:

```bash
cd /srv/personal-site
OBSIDIAN_VAULT=/srv/obsidian/tingu-wiki \
SITE_URL=capablegupta.com \
PUBLIC_ROOT=/var/www/personal-site \
bash ops/publish-on-vps.sh
```

Copy [ops/nginx.conf.example](ops/nginx.conf.example) into the Nginx site configuration, replace the domain, obtain TLS certificates, and reload Nginx.

For unattended operation, the included sync service keeps the server vault current and the timer checks for publishable changes once a minute:

```bash
sudo install -m 0644 ops/obsidian-headless-sync.service /etc/systemd/system/
sudo install -m 0644 ops/personal-site-publish.service /etc/systemd/system/
sudo install -m 0644 ops/personal-site-publish.timer /etc/systemd/system/
sudo cp .env.example /etc/personal-site.env
sudoedit /etc/personal-site.env
sudo systemctl daemon-reload
sudo systemctl enable --now obsidian-headless-sync.service personal-site-publish.timer
```

The publisher creates a release only when the exported public content or site application has changed, keeps completed releases under `/var/www/personal-site/releases`, and atomically moves the `current` link used by Nginx. It retains the five newest releases.

Without an Obsidian Sync subscription, [Syncthing](https://docs.syncthing.net/intro/getting-started) is the recommended alternative: share the vault privately from this computer to `/srv/obsidian/tingu-wiki` on the VPS, then use the same publishing timer. A GitHub-based vault sync can also be added later, but that repository must remain private because it contains unpublished source notes.

## Key configuration

- [scripts/sync-vault.mjs](scripts/sync-vault.mjs): opt-in note and attachment export.
- [scripts/publish-github.mjs](scripts/publish-github.mjs): export, commit, and push public-note updates.
- [scripts/watch-publish-github.mjs](scripts/watch-publish-github.mjs): publish opted-in changes automatically while writing.
- [quartz.config.ts](quartz.config.ts): title, domain, publishing filter, typography, and colors.
- [quartz.layout.ts](quartz.layout.ts): navigation, recent notes, graph, backlinks, and footer.
- [quartz/styles/custom.scss](quartz/styles/custom.scss): Minimal-inspired presentation.
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml): current GitHub Pages deployment.
- [ops/publish-on-vps.sh](ops/publish-on-vps.sh): future VPS rebuild and public-file replacement.
- [ops/obsidian-headless-sync.service](ops/obsidian-headless-sync.service): continuous private Obsidian Sync mirror on the VPS.
- [ops/personal-site-publish.timer](ops/personal-site-publish.timer): unattended publishing after vault sync.
