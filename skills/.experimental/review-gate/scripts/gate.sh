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
  gate.sh siblings <pattern> [<base-ref>] [<path>...]
                                              Files mentioning a behavior-delta keyword must be in the diff or exempted
  gate.sh callers <fn> [<base-ref>] [<path>...]
                                              Call sites of a changed-contract function outside the diff must be read or acknowledged
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

# Doc-sibling sweep: when a diff documents a behavior delta in one surface,
# every other file that mentions the feature's keyword is a sibling surface.
# A sibling absent from the diff is a finding until updated or exempted with
# a reason (changelogs and lockfiles are typical legitimate exemptions).
check_siblings() {
	local pattern="${1:-}"
	[[ -z "$pattern" ]] && usage
	shift
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	local changed
	changed=$(git diff --name-only "$base" 2>/dev/null)
	local hits
	hits=$(git grep -lI --untracked -e "$pattern" -- "${@:-.}" 2>/dev/null || true)
	if [[ -z "$hits" ]]; then
		# Zero hits right after the diff added the keyword means the search
		# space was wrong (bad pathspec), not that no sibling exists.
		local added_hit
		added_hit=$(git diff "$base" --unified=0 -- . 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' | grep -F -- "$pattern" || true)
		if [[ -n "$added_hit" ]]; then
			echo "ERROR [siblings] '$pattern' appears in the diff's added lines but the repo-wide search returned zero hits; check the pathspec arguments"
			return 2
		fi
		echo "PASS [siblings] no file mentions '$pattern'"
		return 0
	fi
	while IFS= read -r f; do
		[[ -z "$f" ]] && continue
		if ! grep -qxF "$f" <<<"$changed"; then
			echo "FINDING [siblings] '$f' mentions '$pattern' but is not in the diff; update it or acknowledge why it is unaffected"
			findings=1
		fi
	done <<<"$hits"
	[[ $findings -eq 0 ]] && echo "PASS [siblings] every file mentioning '$pattern' is in the diff"
	return $findings
}

# Caller sweep: when a diff changes a function's contract (a new failure
# outcome, a new return field, changed semantics), every call site OUTSIDE the
# diff is a reading obligation: state mutated before the call, and assumptions
# about the old contract, break without the caller ever appearing in the diff.
# Mechanical stand-in for a radius Impact Map where the CLI has no language
# support. Each flagged site is read or acknowledged, never skipped silently.
check_callers() {
	local symbol="${1:-}"
	[[ -z "$symbol" ]] && usage
	shift
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	local changed
	changed=$(git diff --name-only "$base" 2>/dev/null)
	local hits
	hits=$(git grep -nI --untracked -e "${symbol}[[:space:]]*(" -- "${@:-.}" 2>/dev/null || true)
	if [[ -z "$hits" ]]; then
		echo "ERROR [callers] no call sites of '${symbol}(' found; check the symbol name and pathspec"
		return 2
	fi
	while IFS= read -r line; do
		[[ -z "$line" ]] && continue
		local f="${line%%:*}"
		if ! grep -qxF "$f" <<<"$changed"; then
			echo "FINDING [callers] call site of '$symbol' outside the diff; read it for state mutated before the call and assumptions the new outcome breaks:"
			echo "  $line"
			findings=1
		fi
	done <<<"$hits"
	[[ $findings -eq 0 ]] && echo "PASS [callers] every call site of '$symbol' is in a diffed file"
	return $findings
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
	siblings) check_siblings "$@" ;;
	callers) check_callers "$@" ;;
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
