import path from "node:path"
import { pathToFileURL } from "node:url"
import { exportGithubGarden } from "./sync-vault.mjs"

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await exportGithubGarden(process.argv[2])
}
