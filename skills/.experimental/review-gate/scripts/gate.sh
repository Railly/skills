#!/usr/bin/env bash
# Deterministic layer of the review gate. Every check is binary: exit 0 (pass) or 1 (findings).
# Run from inside the target repository.
set -uo pipefail

usage() {
	cat <<'EOF'
Usage:
  gate.sh style [<base-ref>]                  Added lines: no em dashes; no " -- " as prose punctuation in comments
  gate.sh stale <pattern> [<path>...]         Repo-wide search for a retired value must return zero hits
  gate.sh surfaces <conventions.md> [<base-ref>]
                                              Touched paths in the surface map require their listed surfaces in the diff
  gate.sh all <conventions.md> [<base-ref>]   style + surfaces

<base-ref> defaults to the merge base with origin/HEAD (falls back to HEAD~1).
Exit codes: 0 pass, 1 findings, 2 usage error.
EOF
	exit 2
}

base_ref() {
	local ref="${1:-}"
	if [[ -n "$ref" ]]; then echo "$ref"; return; fi
	local origin_head
	origin_head=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/@@') || true
	if [[ -n "${origin_head:-}" ]] && git merge-base HEAD "$origin_head" >/dev/null 2>&1; then
		git merge-base HEAD "$origin_head"
	else
		git rev-parse HEAD~1
	fi
}

check_style() {
	local base findings=0
	base=$(base_ref "${1:-}")
	local added
	added=$(git diff "$base" --unified=0 -- . 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' || true)

	local em_dash
	em_dash=$(printf '%s\n' "$added" | grep -n '—' || true)
	if [[ -n "$em_dash" ]]; then
		echo "FINDING [style] em dash in added lines:"
		printf '%s\n' "$em_dash"
		findings=1
	fi

	# " -- " as prose punctuation: only inside comment-looking added lines.
	local dash_comment
	dash_comment=$(printf '%s\n' "$added" | grep -nE '(//|#|/\*|^\+[[:space:]]*\*|<!--).* --( |$)' || true)
	if [[ -n "$dash_comment" ]]; then
		echo "FINDING [style] ' -- ' used as punctuation in added comments (write ',', ';', or a period):"
		printf '%s\n' "$dash_comment"
		findings=1
	fi

	[[ $findings -eq 0 ]] && echo "PASS [style]"
	return $findings
}

check_stale() {
	local pattern="${1:-}"
	[[ -z "$pattern" ]] && usage
	shift
	local hits
	hits=$(git grep -nI --untracked -e "$pattern" -- "${@:-.}" 2>/dev/null || true)
	if [[ -n "$hits" ]]; then
		echo "FINDING [stale] '$pattern' still present (a duplicated contract is aligned only at zero hits):"
		printf '%s\n' "$hits"
		return 1
	fi
	echo "PASS [stale] zero hits for '$pattern'"
	return 0
}

# Surface map lines live in the conventions file inside a fenced block:
#   ```surfaces
#   <touched-glob> :: <required-glob>[, <required-glob>...]
#   ```
check_surfaces() {
	local conv="${1:-}"
	[[ -z "$conv" || ! -f "$conv" ]] && { echo "surfaces: conventions file not found: ${conv:-<missing>}"; return 2; }
	local base findings=0
	base=$(base_ref "${2:-}")
	local changed
	changed=$(git diff --name-only "$base" 2>/dev/null)
	[[ -z "$changed" ]] && { echo "PASS [surfaces] empty diff"; return 0; }

	local rules
	rules=$(awk '/^```surfaces/{f=1;next}/^```/{f=0}f' "$conv" | grep -vE '^\s*(#|$)')
	[[ -z "$rules" ]] && { echo "PASS [surfaces] no surface map in $conv"; return 0; }

	while IFS= read -r rule; do
		local touched="${rule%% ::*}"
		local required="${rule#*:: }"
		touched="$(echo "$touched" | xargs)"
		local hit=""
		while IFS= read -r f; do
			# shellcheck disable=SC2053
			[[ "$f" == $touched ]] && hit="$f" && break
		done <<<"$changed"
		[[ -z "$hit" ]] && continue
		IFS=',' read -ra reqs <<<"$required"
		for req in "${reqs[@]}"; do
			req="$(echo "$req" | xargs)"
			local found=""
			while IFS= read -r f; do
				# shellcheck disable=SC2053
				[[ "$f" == $req ]] && found="$f" && break
			done <<<"$changed"
			if [[ -z "$found" ]]; then
				echo "FINDING [surfaces] diff touches '$hit' but not '$req'; update the surface or acknowledge why it is unaffected"
				findings=1
			fi
		done
	done <<<"$rules"

	[[ $findings -eq 0 ]] && echo "PASS [surfaces]"
	return $findings
}

cmd="${1:-}"
shift || true
case "$cmd" in
	style) check_style "$@" ;;
	stale) check_stale "$@" ;;
	surfaces) check_surfaces "$@" ;;
	all)
		conv="${1:-}"
		ref="${2:-}"
		rc=0
		check_style "$ref" || rc=1
		check_surfaces "$conv" "$ref" || rc=1
		exit $rc
		;;
	*) usage ;;
esac
