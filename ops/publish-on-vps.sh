#!/usr/bin/env bash
set -euo pipefail

: "${OBSIDIAN_VAULT:?Set OBSIDIAN_VAULT to the synced vault directory.}"
: "${SITE_URL:?Set SITE_URL to the custom domain without https://.}"

PUBLIC_ROOT="${PUBLIC_ROOT:-/var/www/personal-site}"
RELEASES_ROOT="${PUBLIC_ROOT}/releases"
RELEASE_ROOT="${RELEASES_ROOT}/$(date -u +%Y%m%d%H%M%S)-$$"
NEXT_LINK="${PUBLIC_ROOT}/.current.next"
CURRENT_LINK="${PUBLIC_ROOT}/current"
DIGEST_FILE="${PUBLIC_ROOT}/.last-public-source-digest"
NEXT_DIGEST_FILE="${PUBLIC_ROOT}/.last-public-source-digest.next"
export QUARTZ_CONTENT_DIR="${QUARTZ_CONTENT_DIR:-/tmp/personal-site-published-content}"

if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
  npm ci
fi

mkdir -p "$PUBLIC_ROOT"
npm run sync:vault

SOURCE_DIGEST="$(
  {
    printf 'SITE_URL=%s\n' "$SITE_URL"
    find "$QUARTZ_CONTENT_DIR" content quartz scripts package-lock.json quartz.config.ts quartz.layout.ts \
      -path 'quartz/.quartz-cache' -prune -o -type f -print0 |
      sort -z |
      xargs -0 sha256sum
  } |
    sha256sum |
    cut -d' ' -f1
)"

if [[ ( -e "$CURRENT_LINK" || -L "$CURRENT_LINK" ) && -f "$DIGEST_FILE" && "$(cat "$DIGEST_FILE")" == "$SOURCE_DIGEST" ]]; then
  printf 'No public changes for %s; keeping current release.\n' "$SITE_URL"
  exit 0
fi

node quartz/bootstrap-cli.mjs build --directory "$QUARTZ_CONTENT_DIR"
mkdir -p "$RELEASE_ROOT"
cp -a public/. "$RELEASE_ROOT/"
ln -sfn "$RELEASE_ROOT" "$NEXT_LINK"
mv -Tf "$NEXT_LINK" "$CURRENT_LINK"
printf '%s\n' "$SOURCE_DIGEST" > "$NEXT_DIGEST_FILE"
mv -Tf "$NEXT_DIGEST_FILE" "$DIGEST_FILE"
find "$RELEASES_ROOT" -mindepth 1 -maxdepth 1 -type d ! -path "$RELEASE_ROOT" -printf '%T@ %p\n' |
  sort -nr |
  tail -n +6 |
  cut -d' ' -f2- |
  xargs -r rm -rf

printf 'Published site for %s to %s\n' "$SITE_URL" "$CURRENT_LINK"
