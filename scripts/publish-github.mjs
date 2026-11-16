import { spawnSync } from "node:child_process"
import path from "node:path"
import { exportGithubContent } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const contentPathspec = "published-notes"

function git(...args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`)
  }
  return result.stdout.trim()
}

await exportGithubContent(process.argv[2])
git("add", "-A", "--", contentPathspec)

const stagedChanges = spawnSync("git", ["diff", "--cached", "--quiet", "--", contentPathspec], {
  cwd: projectRoot,
})
if (stagedChanges.status === 0) {
  console.log("No published note changes to push.")
  process.exit(0)
}
if (stagedChanges.status !== 1) {
  throw new Error("Unable to inspect staged public note changes.")
}

git("commit", "-m", "Publish Obsidian note updates", "--", contentPathspec)
git("push", "origin", "main")
console.log("Published note updates pushed to GitHub Pages.")
