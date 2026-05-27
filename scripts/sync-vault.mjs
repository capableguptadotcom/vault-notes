import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import matter from "gray-matter"
import prettier from "prettier"

const projectRoot = path.resolve(import.meta.dirname, "..")
const curatedContentRoot = path.join(projectRoot, "content")
const defaultContentRoot = path.join(os.tmpdir(), `${path.basename(projectRoot)}-published-content`)
const publicRootFolder = "capablegupta"
const publicCollections = [
  {
    description: "Personal notes, works in progress, and connected ideas.",
    outputFolder: "notes",
    sourceFolder: "notes",
    title: "Notes",
  },
  {
    description: "Technical posts and longer-form public writing.",
    outputFolder: "writing",
    sourceFolder: "writing",
    title: "Writing",
  },
  {
    description: "Short excerpts from other people's work with source links and commentary.",
    outputFolder: "clippings",
    sourceFolder: "clippings",
    title: "Clippings",
  },
]
const collectionBySourceFolder = new Map(
  publicCollections.map((collection) => [collection.sourceFolder, collection]),
)
const managedContentFolders = new Set([
  ...publicCollections.map((collection) => collection.outputFolder),
  "garden",
])
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

function collectionIndexMarkdown(collection) {
  return `---
title: ${collection.title}
publish: true
created: 2026-05-27
published: 2026-05-27
description: ${collection.description}
tags:
  - ${collection.outputFolder}
---

${collection.description}
`
}

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

async function copyIntoContent(file, contentRoot, collection) {
  const destination = path.join(contentRoot, publicRelativePath(file.relativePath, collection))
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.copyFile(file.absolutePath, destination)
  const sourceStats = await fs.stat(file.absolutePath)
  await fs.utimes(destination, sourceStats.atime, sourceStats.mtime)
}

async function copyNoteIntoContent(file, contentRoot, collection) {
  const destination = path.join(contentRoot, publicRelativePath(file.relativePath, collection))
  const markdown = await fs.readFile(file.absolutePath, "utf8")
  const formatted = await prettier.format(markdown, { filepath: destination })
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, formatted)
  const sourceStats = await fs.stat(file.absolutePath)
  await fs.utimes(destination, sourceStats.atime, sourceStats.mtime)
}

function relativePathSegments(relativePath) {
  return relativePath.split(path.sep).filter(Boolean)
}

function publicRelativePath(relativePath, collection) {
  const segments = relativePathSegments(relativePath)
  return segments[0]?.toLowerCase() === publicRootFolder &&
    segments[1]?.toLowerCase() === collection.sourceFolder
    ? segments.slice(2).join(path.sep)
    : relativePath
}

function publicCollectionForNote(note) {
  const [rootFolder, sourceFolder] = relativePathSegments(note.relativePath)
  const normalizedRootFolder = rootFolder?.toLowerCase()
  const normalizedSourceFolder = sourceFolder?.toLowerCase()

  if (normalizedRootFolder === "garden") {
    throw new Error(
      `Published note is still in the retired Garden/ folder: ${note.relativePath}. Move it under capablegupta/notes, capablegupta/writing, or capablegupta/clippings before publishing.`,
    )
  }

  if (collectionBySourceFolder.has(normalizedRootFolder)) {
    throw new Error(
      `Published note must live under capablegupta/notes, capablegupta/writing, or capablegupta/clippings: ${note.relativePath}`,
    )
  }

  if (normalizedRootFolder !== publicRootFolder) {
    throw new Error(
      `Published note must live under the capablegupta/ public root: ${note.relativePath}`,
    )
  }

  const collection = collectionBySourceFolder.get(normalizedSourceFolder)
  if (!collection) {
    throw new Error(
      `Published note must live under capablegupta/notes, capablegupta/writing, or capablegupta/clippings: ${note.relativePath}`,
    )
  }

  return collection
}

function isManagedContentPath(relativePath) {
  const segments = relativePath.split(path.sep)
  return managedContentFolders.has(segments[0]?.toLowerCase())
}

function ensureUniquePublicPaths(files, collection) {
  const publicPaths = new Map()
  for (const file of files) {
    const publicPath = publicRelativePath(file.relativePath, collection)
    const existing = publicPaths.get(publicPath.toLowerCase())
    if (existing && existing !== file.relativePath) {
      throw new Error(
        `Public output path collision in ${collection.title}: "${existing}" and "${file.relativePath}" both map to "${publicPath}".`,
      )
    }
    publicPaths.set(publicPath.toLowerCase(), file.relativePath)
  }
}

function emptyPublishedContent() {
  return new Map(
    publicCollections.map((collection) => [
      collection.outputFolder,
      { collection, publishedNotes: [], selectedAssets: new Map() },
    ]),
  )
}

function summarizePublishedContent(collections) {
  const summary = {
    assetCount: 0,
    collectionCounts: {},
    noteCount: 0,
  }

  for (const [outputFolder, group] of collections) {
    const noteCount = group.publishedNotes.length
    const assetCount = group.selectedAssets.size
    summary.noteCount += noteCount
    summary.assetCount += assetCount
    summary.collectionCounts[outputFolder] = { assetCount, noteCount }
  }

  return summary
}

async function copyCuratedContent(contentRoot) {
  const contentFiles = await collectFiles(curatedContentRoot, curatedContentRoot)
  for (const file of contentFiles) {
    if (isManagedContentPath(file.relativePath)) continue
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

async function resetManagedContentRoots(contentRoot) {
  for (const collection of publicCollections) {
    await clearContentRoot(path.join(contentRoot, collection.outputFolder))
  }

  await fs.rm(path.join(contentRoot, "garden"), { recursive: true, force: true })
}

async function selectPublishedContent(vaultRoot) {
  const allFiles = await collectFiles(vaultRoot, vaultRoot)
  const markdownFiles = allFiles.filter(
    (file) => path.extname(file.relativePath).toLowerCase() === ".md",
  )
  const collections = emptyPublishedContent()

  for (const note of markdownFiles) {
    const markdown = await fs.readFile(note.absolutePath, "utf8")
    if (matter(markdown).data.publish !== true) continue
    const collection = publicCollectionForNote(note)
    const group = collections.get(collection.outputFolder)
    group.publishedNotes.push(note)

    for (const target of embeddedAssets(markdown)) {
      if (!isPublishableAsset(target)) continue
      const asset = resolveAsset(target, note.absolutePath, vaultRoot, allFiles)
      if (asset) group.selectedAssets.set(asset.relativePath.toLowerCase(), asset)
      else console.warn(`Referenced asset not found: ${target} (from ${note.relativePath})`)
    }
  }

  for (const group of collections.values()) {
    ensureUniquePublicPaths(
      [...group.publishedNotes, ...group.selectedAssets.values()],
      group.collection,
    )
  }

  return collections
}

async function writeCollectionIndex(contentRoot, collection) {
  const destination = path.join(contentRoot, "index.md")
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, collectionIndexMarkdown(collection))
}

async function writeCollectionContent(contentRoot, group) {
  await writeCollectionIndex(contentRoot, group.collection)
  for (const note of group.publishedNotes)
    await copyNoteIntoContent(note, contentRoot, group.collection)
  for (const asset of group.selectedAssets.values()) {
    await copyIntoContent(asset, contentRoot, group.collection)
  }
}

async function writePublicContent(contentRoot, collections) {
  for (const group of collections.values()) {
    await writeCollectionContent(path.join(contentRoot, group.collection.outputFolder), group)
  }
}

export async function exportGithubContent(explicitVault, explicitContentRoot = curatedContentRoot) {
  const vaultRoot = await findVault(explicitVault)
  const contentRoot = path.resolve(explicitContentRoot)
  const collections = await selectPublishedContent(vaultRoot)
  const summary = summarizePublishedContent(collections)

  await resetManagedContentRoots(contentRoot)
  await writePublicContent(contentRoot, collections)

  console.log(`Vault: ${vaultRoot}`)
  console.log(`GitHub Pages export: ${contentRoot}`)
  console.log(
    `Exported ${summary.noteCount} public note(s) and ${summary.assetCount} referenced asset(s).`,
  )

  return {
    ...summary,
    contentRoot,
    vaultRoot,
  }
}

export async function syncVault(
  explicitVault,
  explicitContentRoot = process.env.QUARTZ_CONTENT_DIR,
) {
  const vaultRoot = await findVault(explicitVault)
  const contentRoot = explicitContentRoot ? path.resolve(explicitContentRoot) : defaultContentRoot
  const collections = await selectPublishedContent(vaultRoot)
  const summary = summarizePublishedContent(collections)

  await clearContentRoot(contentRoot)
  await copyCuratedContent(contentRoot)
  await writePublicContent(contentRoot, collections)

  console.log(`Vault: ${vaultRoot}`)
  console.log(`Quartz content: ${contentRoot}`)
  console.log(
    `Published ${summary.noteCount} note(s) and ${summary.assetCount} referenced asset(s).`,
  )

  return {
    ...summary,
    contentRoot,
    vaultRoot,
  }
}

export async function publicRoot(explicitVault) {
  const vaultRoot = await findVault(explicitVault)
  return path.join(vaultRoot, publicRootFolder)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await syncVault(process.argv[2])
}
