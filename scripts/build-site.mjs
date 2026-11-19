import { spawn } from "node:child_process"
import { once } from "node:events"
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import process from "node:process"
import { syncVault } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const githubBuild = args[0] === "--github"
const contentRoot = githubBuild
  ? await fs.mkdtemp(path.join(os.tmpdir(), "capablegupta-site-"))
  : (await syncVault()).contentRoot

try {
  if (githubBuild) {
    await fs.cp(path.join(projectRoot, "content"), contentRoot, { recursive: true })
    for (const section of ["notes", "writing", "reading"]) {
      const source = path.join(projectRoot, "published-notes", section)
      if (existsSync(source)) {
        await fs.cp(source, path.join(contentRoot, section), { recursive: true, force: false })
      }
    }
  }

  const quartzArgs = [
    path.join(projectRoot, "quartz", "bootstrap-cli.mjs"),
    "build",
    "--directory",
    contentRoot,
    ...args.slice(githubBuild ? 1 : 0),
  ]
  const build = spawn(process.execPath, quartzArgs, { cwd: projectRoot, stdio: "inherit" })
  const [code] = await once(build, "exit")
  process.exitCode = code ?? 1
} finally {
  if (githubBuild) await fs.rm(contentRoot, { recursive: true, force: true })
}
