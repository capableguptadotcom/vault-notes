import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { exportGithubContent } from "./sync-vault.mjs"

const projectRoot = path.resolve(import.meta.dirname, "..")
const managedContentPaths = ["content/notes", "content/writing", "content/clippings"]
const retiredContentPaths = ["content/garden"]

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

function isKnownGitPathspec(pathspec) {
  if (fs.existsSync(path.join(projectRoot, pathspec))) return true
  const result = spawnSync("git", ["ls-files", "--error-unmatch", pathspec], {
    cwd: projectRoot,
    stdio: "ignore",
  })
  return result.status === 0
}

await exportGithubContent(process.argv[2])
const contentPathspecs = [...managedContentPaths, ...retiredContentPaths].filter(isKnownGitPathspec)
git("add", "-A", "--", ...contentPathspecs)

const stagedChanges = spawnSync("git", ["diff", "--cached", "--quiet", "--", ...contentPathspecs], {
  cwd: projectRoot,
})
if (stagedChanges.status === 0) {
  console.log("No published note changes to push.")
  process.exit(0)
}
if (stagedChanges.status !== 1) {
  throw new Error("Unable to inspect staged public note changes.")
}

git("commit", "-m", "Publish Obsidian note updates", "--", ...contentPathspecs)
git("push", "origin", "main")
console.log("Published note updates pushed to GitHub Pages.")
