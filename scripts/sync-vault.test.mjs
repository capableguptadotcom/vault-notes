import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { after, before, test } from "node:test"
import { exportGithubGarden, syncVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const fixtureVault = path.join(projectRoot, "test", "fixtures", "vault")
const outputRoot = path.join(os.tmpdir(), `personal-site-sync-test-${process.pid}`)
const exportedContent = path.join(outputRoot, "content")
const renderedSite = path.join(outputRoot, "public")
const buildEnvironment = {
  ...process.env,
  OBSIDIAN_VAULT: fixtureVault,
  QUARTZ_CONTENT_DIR: exportedContent,
  SITE_URL: "garden.test",
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
  assert.match(result.stdout, /Published 1 note\(s\) and 1 referenced asset\(s\)\./)
  assert.equal(fs.existsSync(path.join(exportedContent, "garden", "Published note.md")), true)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "garden", "Garden", "Published note.md")),
    false,
  )
  assert.equal(
    fs.existsSync(path.join(exportedContent, "garden", "media", "public-image.svg")),
    true,
  )
  assert.equal(fs.existsSync(path.join(exportedContent, "garden", "Private note.md")), false)
  assert.equal(
    fs.existsSync(path.join(exportedContent, "garden", "Templates", "Should not publish.md")),
    false,
  )
  assert.equal(
    fs.existsSync(path.join(exportedContent, "garden", "media", "private-image.svg")),
    false,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "garden", "Published-note.html")), true)
  assert.equal(
    fs.existsSync(path.join(renderedSite, "garden", "Garden", "Published-note.html")),
    false,
  )
  assert.equal(fs.existsSync(path.join(renderedSite, "garden", "media", "public-image.svg")), true)
  assert.equal(fs.existsSync(path.join(renderedSite, "garden", "Private-note.html")), false)
  assert.equal(
    fs.existsSync(path.join(renderedSite, "garden", "media", "private-image.svg")),
    false,
  )
})

test("rejects public paths that collide after Garden URL normalization", async () => {
  const collisionVault = path.join(outputRoot, "collision-vault")
  const collisionContent = path.join(outputRoot, "collision-content")
  fs.mkdirSync(path.join(collisionVault, "Garden"), { recursive: true })
  fs.writeFileSync(path.join(collisionVault, "Welcome.md"), "---\npublish: true\n---\n")
  fs.writeFileSync(path.join(collisionVault, "Garden", "Welcome.md"), "---\npublish: true\n---\n")

  await assert.rejects(
    () => syncVault(collisionVault, collisionContent),
    /Public output path collision/,
  )
})

test("exports only opted-in content for a public GitHub Pages repository", async () => {
  const githubGarden = path.join(outputRoot, "github-garden")
  const result = await exportGithubGarden(fixtureVault, githubGarden)

  assert.equal(result.noteCount, 1)
  assert.equal(result.assetCount, 1)
  assert.equal(fs.existsSync(path.join(githubGarden, "Published note.md")), true)
  assert.equal(fs.existsSync(path.join(githubGarden, "media", "public-image.svg")), true)
  assert.equal(fs.existsSync(path.join(githubGarden, "Private note.md")), false)
  assert.equal(fs.existsSync(path.join(githubGarden, "media", "private-image.svg")), false)
})
