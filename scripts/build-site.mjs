import { spawn } from "node:child_process"
import path from "node:path"
import process from "node:process"
import { syncVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const { contentRoot } = await syncVault()
const quartzArgs = [
  path.join(projectRoot, "quartz", "bootstrap-cli.mjs"),
  "build",
  "--directory",
  contentRoot,
  ...process.argv.slice(2),
]

const build = spawn(process.execPath, quartzArgs, {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
})

build.on("exit", (code) => {
  process.exitCode = code ?? 1
})
