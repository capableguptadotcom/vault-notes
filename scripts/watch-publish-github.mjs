import chokidar from "chokidar"
import { spawn } from "node:child_process"
import path from "node:path"
import { findVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const vaultRoot = await findVault(process.argv[2])
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

console.log(`Watching public note changes for GitHub Pages in ${vaultRoot}`)
const watcher = chokidar.watch(vaultRoot, {
  awaitWriteFinish: { pollInterval: 100, stabilityThreshold: 500 },
  ignored,
  ignoreInitial: true,
})

publish()

watcher.on("all", (eventName, changedPath) => {
  console.log(`Vault ${eventName}: ${path.relative(vaultRoot, changedPath)}`)
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
