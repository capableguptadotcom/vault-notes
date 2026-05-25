import { spawn } from "node:child_process"
import path from "node:path"
import process from "node:process"
import chokidar from "chokidar"
import { findVault, syncVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const vaultRoot = await findVault(process.argv[2])
const ignored = /(^|[/\\])(?:\.git|\.obsidian|\.trash|templates?)([/\\]|$)/i
let syncRunning = false
let syncQueued = false
let contentRoot

async function refreshContent() {
  if (syncRunning) {
    syncQueued = true
    return
  }

  syncRunning = true
  try {
    ;({ contentRoot } = await syncVault(vaultRoot))
  } catch (error) {
    console.error(`Vault export failed: ${error.message}`)
  } finally {
    syncRunning = false
    if (syncQueued) {
      syncQueued = false
      await refreshContent()
    }
  }
}

await refreshContent()
console.log(`Watching published note changes in ${vaultRoot}`)

const preview = spawn(
  process.execPath,
  [
    path.join(projectRoot, "quartz", "bootstrap-cli.mjs"),
    "build",
    "--directory",
    contentRoot,
    "--serve",
  ],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  },
)

const watcher = chokidar.watch(vaultRoot, {
  awaitWriteFinish: {
    pollInterval: 100,
    stabilityThreshold: 250,
  },
  ignored,
  ignoreInitial: true,
})

watcher.on("all", async (eventName, changedPath) => {
  console.log(`Vault ${eventName}: ${path.relative(vaultRoot, changedPath)}`)
  await refreshContent()
})

async function shutDown(exitCode = 0) {
  await watcher.close()
  preview.kill()
  process.exit(exitCode)
}

preview.on("exit", (code) => {
  void shutDown(code ?? 0)
})
process.on("SIGINT", () => void shutDown())
process.on("SIGTERM", () => void shutDown())
