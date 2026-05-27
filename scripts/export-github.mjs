import path from "node:path"
import { pathToFileURL } from "node:url"
import { exportGithubContent } from "./sync-vault.mjs"

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await exportGithubContent(process.argv[2])
}
