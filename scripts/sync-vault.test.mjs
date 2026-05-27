import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { after, before, test } from "node:test"
import prettier from "prettier"
import { exportGithubContent, syncVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const fixtureVault = path.join(projectRoot, "test", "fixtures", "vault")
const outputRoot = path.join(os.tmpdir(), `personal-site-sync-test-${process.pid}`)
const exportedContent = path.join(outputRoot, "content")
const renderedSite = path.join(outputRoot, "public")
const buildEnvironment = {
  ...process.env,
  OBSIDIAN_VAULT: fixtureVault,
  QUARTZ_CONTENT_DIR: exportedContent,
  SITE_URL: "sections.test",
}

before(() => {
  fs.rmSync(outputRoot, { recursive: true, force: true })
})

after(() => {
  fs.rmSync(outputRoot, { recursive: true, force: true })
})

test("renders only public notes and assets embedded by them", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(projectRoot, "scripts", "build-site.mjs"), "--output", renderedSite],
    {
      cwd: projectRoot,
      env: buildEnvironment,
      encoding: "utf8",
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Published 3 note\(s\) and 2 referenced asset\(s\)\./)
  assert.equal(fs.existsSync(path.join(exportedContent, "notes", "index.md")), true)
  assert.equal(fs.existsSync(path.join(exportedContent, "notes", "Published note.md")), true)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "notes", "Notes", "Published note.md")),
    false,
  )
  assert.equal(
    fs.existsSync(path.join(exportedContent, "notes", "media", "public-image.svg")),
    true,
  )
  assert.equal(fs.existsSync(path.join(exportedContent, "writing", "index.md")), true)
  assert.equal(fs.existsSync(path.join(exportedContent, "writing", "Technical post.md")), true)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "writing", "media", "writing-image.svg")),
    true,
  )
  assert.equal(fs.existsSync(path.join(exportedContent, "clippings", "index.md")), true)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "clippings", "Interesting article.md")),
    true,
  )
  assert.equal(fs.existsSync(path.join(exportedContent, "notes", "Private note.md")), false)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "notes", "Templates", "Should not publish.md")),
    false,
  )
  assert.equal(
    fs.existsSync(path.join(exportedContent, "notes", "media", "private-image.svg")),
    false,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "notes", "index.html")), true)
  assert.equal(fs.existsSync(path.join(renderedSite, "notes", "Published-note.html")), true)
  assert.equal(
    fs.existsSync(path.join(renderedSite, "notes", "Notes", "Published-note.html")),
    false,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "notes", "media", "public-image.svg")), true)
  assert.equal(fs.existsSync(path.join(renderedSite, "writing", "index.html")), true)
  assert.equal(fs.existsSync(path.join(renderedSite, "writing", "Technical-post.html")), true)
  assert.equal(
    fs.existsSync(path.join(renderedSite, "writing", "media", "writing-image.svg")),
    true,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "clippings", "index.html")), true)
  assert.equal(
    fs.existsSync(path.join(renderedSite, "clippings", "Interesting-article.html")),
    true,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "notes", "Private-note.html")), false)
  assert.equal(fs.existsSync(path.join(renderedSite, "notes", "media", "private-image.svg")), false)
})

test("rejects public paths that collide inside a collection", async () => {
  const collisionVault = path.join(outputRoot, "collision-vault")
  const collisionContent = path.join(outputRoot, "collision-content")
  fs.mkdirSync(path.join(collisionVault, "Notes", "media"), { recursive: true })
  fs.mkdirSync(path.join(collisionVault, "media"), { recursive: true })
  fs.writeFileSync(
    path.join(collisionVault, "Notes", "Welcome.md"),
    "---\npublish: true\n---\n\n![[media/photo.svg]]\n\n![Other](../media/photo.svg)\n",
  )
  fs.writeFileSync(path.join(collisionVault, "Notes", "media", "photo.svg"), "<svg></svg>")
  fs.writeFileSync(path.join(collisionVault, "media", "photo.svg"), "<svg></svg>")

  await assert.rejects(
    () => syncVault(collisionVault, collisionContent),
    /Public output path collision in Notes/,
  )
})

test("rejects published notes in the retired Garden source folder", async () => {
  const gardenVault = path.join(outputRoot, "garden-vault")
  const gardenContent = path.join(outputRoot, "garden-content")
  fs.mkdirSync(path.join(gardenVault, "Garden"), { recursive: true })
  fs.writeFileSync(path.join(gardenVault, "Garden", "Welcome.md"), "---\npublish: true\n---\n")

  await assert.rejects(() => syncVault(gardenVault, gardenContent), /retired Garden\/ folder/)
})

test("rejects published notes outside approved section folders", async () => {
  const looseVault = path.join(outputRoot, "loose-vault")
  const looseContent = path.join(outputRoot, "loose-content")
  fs.mkdirSync(looseVault, { recursive: true })
  fs.writeFileSync(path.join(looseVault, "Welcome.md"), "---\npublish: true\n---\n")

  await assert.rejects(
    () => syncVault(looseVault, looseContent),
    /must live under Notes\/, Writing\/, or Clippings\//,
  )
})

test("exports only opted-in content for a public GitHub Pages repository", async () => {
  const githubContent = path.join(outputRoot, "github-content")
  const result = await exportGithubContent(fixtureVault, githubContent)

  assert.equal(result.noteCount, 3)
  assert.equal(result.assetCount, 2)
  assert.deepEqual(result.collectionCounts.notes, { assetCount: 1, noteCount: 1 })
  assert.deepEqual(result.collectionCounts.writing, { assetCount: 1, noteCount: 1 })
  assert.deepEqual(result.collectionCounts.clippings, { assetCount: 0, noteCount: 1 })
  assert.equal(fs.existsSync(path.join(githubContent, "notes", "index.md")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "notes", "Published note.md")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "notes", "media", "public-image.svg")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "writing", "index.md")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "writing", "Technical post.md")), true)
  assert.equal(
    fs.existsSync(path.join(githubContent, "writing", "media", "writing-image.svg")),
    true,
  )
  assert.equal(fs.existsSync(path.join(githubContent, "clippings", "index.md")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "clippings", "Interesting article.md")), true)
  assert.equal(fs.existsSync(path.join(githubContent, "garden")), false)
  assert.equal(fs.existsSync(path.join(githubContent, "notes", "Private note.md")), false)
  assert.equal(
    fs.existsSync(path.join(githubContent, "notes", "media", "private-image.svg")),
    false,
  )
})

test("formats published Markdown while leaving the vault source untouched", async () => {
  const formattingVault = path.join(outputRoot, "formatting-vault")
  const githubContent = path.join(outputRoot, "formatted-github-content")
  const sourcePath = path.join(formattingVault, "Notes", "Unformatted.md")
  const source =
    "---\ntitle: Messy\npublish: true\n---\n\nText with\n\n[a link](https://example.com)\n\nand more text.\n"

  fs.mkdirSync(path.dirname(sourcePath), { recursive: true })
  fs.writeFileSync(sourcePath, source)

  await exportGithubContent(formattingVault, githubContent)

  const exported = fs.readFileSync(path.join(githubContent, "notes", "Unformatted.md"), "utf8")
  assert.equal(exported, await prettier.format(source, { filepath: "notes/Unformatted.md" }))
  assert.equal(fs.readFileSync(sourcePath, "utf8"), source)
})
