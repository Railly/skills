# Shared by observe.sh and fresh.sh. Digest of tracked changes plus untracked files,
# so an observation is tied to the exact tree it saw. evidence/ is gitignored.
tree_digest() {
  local root="$1"
  {
    git -C "$root" diff HEAD
    git -C "$root" ls-files --others --exclude-standard -z | (cd "$root" && xargs -0 shasum 2>/dev/null)
  } | shasum -a 256 | cut -c1-16
}
