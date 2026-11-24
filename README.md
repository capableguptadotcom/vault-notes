# capablegupta.com

## Build locally

Requires Node.js 22+ and npm 10.9.2+.

```sh
npm ci
npm run build:github
```

The build writes to `public/`.

## Deploy changes

Push or merge changes to `main`. GitHub Actions runs the checks and deploys to GitHub Pages if the build succeeds.
