import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import matter from "gray-matter"

const projectRoot = path.resolve(import.meta.dirname, "..")
const curatedContentRoot = path.join(projectRoot, "content")
const defaultContentRoot = path.join(os.tmpdir(), `${path.basename(projectRoot)}-published-content`)
const githubGardenRoot = path.join(curatedContentRoot, "garden")
const publicCollectionFolder = "garden"
const ignoredFolders = new Set([
  ".git",
  ".obsidian",
  ".trash",
  "node_modules",
  "template",
  "templates",
])
const safeAssetExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".svg",
  ".webm",
  ".webp",
])

export async function findVault(explicit = process.env.OBSIDIAN_VAULT) {
  if (explicit) return path.resolve(explicit)

  if (process.platform !== "win32" || !process.env.APPDATA) {
    throw new Error("Set OBSIDIAN_VAULT to the absolute path of the vault to publish.")
  }

  const obsidianConfig = path.join(process.env.APPDATA, "obsidian", "obsidian.json")
  const config = JSON.parse(await fs.readFile(obsidianConfig, "utf8"))
  const openVault = Object.values(config.vaults ?? {}).find((vault) => vault.open)
  if (!openVault?.path) {
    throw new Error("No open Obsidian vault found. Set OBSIDIAN_VAULT explicitly.")
  }
  return openVault.path
}

async function collectFiles(directory, root, files = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredFolders.has(entry.name.toLowerCase())) continue
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await collectFiles(absolutePath, root, files)
    } else {
      files.push({ absolutePath, relativePath: path.relative(root, absolutePath) })
    }
  }
  return files
}

function embeddedAssets(markdown) {
  const targets = new Set()
  const wikiEmbed = /!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g
  const markdownImage = /!\[[^\]]*]\((?:<([^>]+)>|([^) \t]+))(?:\s+["'][^"']*["'])?\)/g

  for (const match of markdown.matchAll(wikiEmbed)) targets.add(match[1].trim())
  for (const match of markdown.matchAll(markdownImage)) targets.add((match[1] ?? match[2]).trim())
  return targets
}

function isPublishableAsset(target) {
  if (/^(?:https?:|data:|#)/i.test(target)) return false
  const cleanTarget = decodeURIComponent(target.split("#", 1)[0])
  return safeAssetExtensions.has(path.extname(cleanTarget).toLowerCase())
}

function resolveAsset(target, notePath, vaultRoot, allFiles) {
  const cleanTarget = decodeURIComponent(target.split("#", 1)[0]).replaceAll("/", path.sep)
  const directCandidates = [
    path.resolve(path.dirname(notePath), cleanTarget),
    path.resolve(vaultRoot, cleanTarget.replace(/^[/\\]+/, "")),
  ]
  const vaultPrefix = `${path.resolve(vaultRoot)}${path.sep}`.toLowerCase()

  for (const candidate of directCandidates) {
    if (candidate.toLowerCase().startsWith(vaultPrefix)) {
      const found = allFiles.find((file) => path.resolve(file.absolutePath) === candidate)
      if (found) return found
    }
  }

  const filename = path.basename(cleanTarget).toLowerCase()
  const matches = allFiles.filter(
    (file) => path.basename(file.relativePath).toLowerCase() === filename,
  )
  return matches.length === 1 ? matches[0] : undefined
}

async function copyIntoContent(file, contentRoot, prefix = "") {
  const destination = path.join(contentRoot, prefix, publicRelativePath(file.relativePath))
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.copyFile(file.absolutePath, destination)
  const sourceStats = await fs.stat(file.absolutePath)
  await fs.utimes(destination, sourceStats.atime, sourceStats.mtime)
}

function publicRelativePath(relativePath) {
  const segments = relativePath.split(path.sep)
  return segments[0]?.toLowerCase() === publicCollectionFolder
    ? segments.slice(1).join(path.sep)
    : relativePath
}

function ensureUniquePublicPaths(files) {
  const publicPaths = new Map()
  for (const file of files) {
    const publicPath = publicRelativePath(file.relativePath)
    const existing = publicPaths.get(publicPath.toLowerCase())
    if (existing && existing !== file.relativePath) {
      throw new Error(
        `Public output path collision: "${existing}" and "${file.relativePath}" both map to "${publicPath}".`,
      )
    }
    publicPaths.set(publicPath.toLowerCase(), file.relativePath)
  }
}

async function copyCuratedContent(contentRoot) {
  const contentFiles = await collectFiles(curatedContentRoot, curatedContentRoot)
  for (const file of contentFiles) {
    if (file.relativePath.toLowerCase().startsWith(`garden${path.sep}`)) continue
    const destination = path.join(contentRoot, file.relativePath)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(file.absolutePath, destination)
    const sourceStats = await fs.stat(file.absolutePath)
    await fs.utimes(destination, sourceStats.atime, sourceStats.mtime)
  }
}

async function clearContentRoot(contentRoot) {
  await fs.mkdir(contentRoot, { recursive: true })
  for (const entry of await fs.readdir(contentRoot)) {
    await fs.rm(path.join(contentRoot, entry), { recursive: true, force: true })
  }
}

async function selectPublishedContent(vaultRoot) {
  const allFiles = await collectFiles(vaultRoot, vaultRoot)
  const markdownFiles = allFiles.filter(
    (file) => path.extname(file.relativePath).toLowerCase() === ".md",
  )
  const publishedNotes = []
  const selectedAssets = new Map()

  for (const note of markdownFiles) {
    const markdown = await fs.readFile(note.absolutePath, "utf8")
    if (matter(markdown).data.publish !== true) continue
    publishedNotes.push(note)

    for (const target of embeddedAssets(markdown)) {
      if (!isPublishableAsset(target)) continue
      const asset = resolveAsset(target, note.absolutePath, vaultRoot, allFiles)
      if (asset) selectedAssets.set(asset.relativePath.toLowerCase(), asset)
      else console.warn(`Referenced asset not found: ${target} (from ${note.relativePath})`)
    }
  }

  ensureUniquePublicPaths([...publishedNotes, ...selectedAssets.values()])

  return { publishedNotes, selectedAssets }
}

async function writePublicContent(contentRoot, publishedNotes, selectedAssets, prefix = "") {
  for (const note of publishedNotes) await copyIntoContent(note, contentRoot, prefix)
  for (const asset of selectedAssets.values()) await copyIntoContent(asset, contentRoot, prefix)
}

export async function exportGithubGarden(explicitVault, explicitGardenRoot = githubGardenRoot) {
  const vaultRoot = await findVault(explicitVault)
  const gardenRoot = path.resolve(explicitGardenRoot)
  const { publishedNotes, selectedAssets } = await selectPublishedContent(vaultRoot)

  await clearContentRoot(gardenRoot)
  await writePublicContent(gardenRoot, publishedNotes, selectedAssets)

  console.log(`Vault: ${vaultRoot}`)
  console.log(`GitHub Pages export: ${gardenRoot}`)
  console.log(
    `Exported ${publishedNotes.length} public note(s) and ${selectedAssets.size} referenced asset(s).`,
  )

  return {
    assetCount: selectedAssets.size,
    gardenRoot,
    noteCount: publishedNotes.length,
    vaultRoot,
  }
}

export async function syncVault(
  explicitVault,
  explicitContentRoot = process.env.QUARTZ_CONTENT_DIR,
) {
  const vaultRoot = await findVault(explicitVault)
  const contentRoot = explicitContentRoot ? path.resolve(explicitContentRoot) : defaultContentRoot
  const { publishedNotes, selectedAssets } = await selectPublishedContent(vaultRoot)

  await clearContentRoot(contentRoot)
  await copyCuratedContent(contentRoot)
  await writePublicContent(contentRoot, publishedNotes, selectedAssets, "garden")

  console.log(`Vault: ${vaultRoot}`)
  console.log(`Quartz content: ${contentRoot}`)
  console.log(
    `Published ${publishedNotes.length} note(s) and ${selectedAssets.size} referenced asset(s).`,
  )

  return {
    assetCount: selectedAssets.size,
    contentRoot,
    noteCount: publishedNotes.length,
    vaultRoot,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await syncVault(process.argv[2])
}
