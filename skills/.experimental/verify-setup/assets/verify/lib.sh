# Shared by observe.sh and fresh.sh. The digest is the git tree hash of the
# working tree contents (tracked plus untracked, ignored files excluded), so an
# observation stays valid across a commit of the same code and dies with any
# edit. evidence/ is gitignored.
tree_digest() {
  local root="$1" index
  index="$(mktemp)"
  rm -f "$index"
  GIT_INDEX_FILE="$index" git -C "$root" read-tree HEAD 2>/dev/null
  GIT_INDEX_FILE="$index" git -C "$root" add -A >/dev/null 2>&1
  GIT_INDEX_FILE="$index" git -C "$root" write-tree
  rm -f "$index"
}

# Fail when a built artifact is older than any of its sources, so a driver never
# observes code this tree did not produce. Usage: artifact_current <artifact> <src>...
artifact_current() {
  local artifact="$1"; shift
  [ -e "$artifact" ] || { echo "missing artifact: $artifact (build it first)" >&2; return 1; }
  local newer
  newer="$(find "$@" -newer "$artifact" -type f 2>/dev/null | head -1)"
  [ -z "$newer" ] || { echo "stale artifact: $artifact is older than $newer" >&2; return 1; }
}
