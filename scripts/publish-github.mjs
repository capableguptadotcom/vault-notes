import { spawnSync } from "node:child_process"
import path from "node:path"
import { exportGithubGarden } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")

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

await exportGithubGarden(process.argv[2])
git("add", "--", "content/garden")

const stagedChanges = spawnSync("git", ["diff", "--cached", "--quiet", "--", "content/garden"], {
  cwd: projectRoot,
})
if (stagedChanges.status === 0) {
  console.log("No published note changes to push.")
  process.exit(0)
}
if (stagedChanges.status !== 1) {
  throw new Error("Unable to inspect staged public note changes.")
}

git("commit", "-m", "Publish Obsidian note updates", "--", "content/garden")
git("push", "origin", "main")
console.log("Published note updates pushed to GitHub Pages.")
