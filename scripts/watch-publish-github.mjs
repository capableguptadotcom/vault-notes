import chokidar from "chokidar"
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { findVault, publicRoot } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const vaultRoot = await findVault(process.argv[2])
const watchedRoot = await publicRoot(vaultRoot)
const ignored = /(^|[/\\])(?:\.git|\.obsidian|\.trash|templates?)([/\\]|$)/i
let running = false
let queued = false
let timer

function publish() {
  if (running) {
    queued = true
    return
  }

  running = true
  const child = spawn(
    process.execPath,
    [path.join(projectRoot, "scripts", "publish-github.mjs"), vaultRoot],
    {
      cwd: projectRoot,
      stdio: "inherit",
    },
  )
  child.on("exit", (code) => {
    running = false
    if (code !== 0) console.error("GitHub publication failed; the watcher will keep running.")
    if (queued) {
      queued = false
      publish()
    }
  })
}

if (!fs.existsSync(watchedRoot)) {
  throw new Error(`Public root folder not found: ${watchedRoot}`)
}

console.log(`Watching public note changes for GitHub Pages in ${watchedRoot}`)
const watcher = chokidar.watch(watchedRoot, {
  awaitWriteFinish: { pollInterval: 100, stabilityThreshold: 500 },
  ignored,
  ignoreInitial: true,
})

publish()

watcher.on("all", (eventName, changedPath) => {
  console.log(`Public root ${eventName}: ${path.relative(watchedRoot, changedPath)}`)
  clearTimeout(timer)
  timer = setTimeout(publish, 1000)
})

process.on("SIGINT", async () => {
  await watcher.close()
  process.exit(0)
})
process.on("SIGTERM", async () => {
  await watcher.close()
  process.exit(0)
})
