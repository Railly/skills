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
  gate.sh producers <shape-regex> [<base-ref>] [<path>...]
                                              When a diff narrows an error classifier, every error-string producer matching the OLD shape
                                              and living outside the diff must be re-checked against the NEW predicate or acknowledged
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
		else
			# File is in the diff, but a passage inside it can still be stale.
			# Line-level check: matching lines in the working file vs matching
			# lines the diff added. More in the file than the diff touched means
			# an untouched sibling passage still describes the behavior
			# (#364/#367 intra-file miss the file-presence check cannot catch).
			local file_hits added_hits
			file_hits=$(grep -cF -- "$pattern" "$f" 2>/dev/null) || file_hits=0
			added_hits=$(git diff "$base" -- "$f" 2>/dev/null | grep -E '^\+' | grep -vE '^\+\+\+' | grep -cF -- "$pattern") || added_hits=0
			if [[ "$file_hits" -gt "$added_hits" ]]; then
				echo "FINDING [siblings] '$f' is in the diff but mentions '$pattern' on $((file_hits - added_hits)) line(s) the diff did not add; check those passages for stale behavior text or acknowledge"
				findings=1
			fi
		fi
	done <<<"$hits"
	[[ $findings -eq 0 ]] && echo "PASS [siblings] every file mentioning '$pattern' is in the diff, and no untouched line in a diffed file still mentions it"
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

# Inverse of check_callers: when a diff NARROWS an error classifier (a predicate
# that decides whether a message is a locator miss, a retryable error, etc.), the
# regression lives in error-string PRODUCERS outside the diff whose output used to
# match the broad predicate and no longer matches the narrow one. This enumerates
# every producer matching the old error shape; each is re-checked against the new
# predicate or acknowledged. Provenance: agent-browser #1553 round 3 (F4): the diff
# narrowed is_locator_miss, and handle_multiselect's "Select element not found"
# (outside the diff) stopped classifying and surfaced raw. Full-recall on its class.
check_producers() {
	local shape="${1:-}"
	[[ -z "$shape" ]] && usage
	shift
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	# Added-line ranges per file (NEW-side line numbers) from the diff. A producer
	# is "in the diff" only if its own line was added/changed; a producer in a
	# changed FILE but on an untouched LINE is exactly the regression this gate
	# exists for (agent-browser #1553 F4 and #1532 both lived in the same file as
	# the change, on lines the diff never showed). File-level granularity misses them.
	local added
	added=$(git diff -U0 "$base" -- "${@:-.}" 2>/dev/null | awk '
		/^\+\+\+ /{ f=$2; sub(/^b\//,"",f); next }
		/^@@ /{ split($3,a,","); s=a[1]; sub(/^\+/,"",s); n=(a[2]==""?1:a[2]); if(n>0) print f":"s":"(s+n-1) }')
	# Producer sites: an error string being constructed (throw new Error, format!,
	# ok_or/ok_or_else, Err(...)) whose text matches the shape regex.
	local hits
	hits=$(git grep -nIE "(throw new Error|format!|ok_or|ok_or_else|return Err|Err)\(.*(${shape})" -- "${@:-.}" 2>/dev/null || true)
	if [[ -z "$hits" ]]; then
		echo "ERROR [producers] no error producers matching /$shape/ found; check the shape regex and pathspec"
		return 2
	fi
	while IFS= read -r line; do
		[[ -z "$line" ]] && continue
		grep -qiE "test|assert" <<<"$line" && continue
		local f="${line%%:*}"
		local rest="${line#*:}"
		local ln="${rest%%:*}"
		local in_diff=0
		while IFS= read -r range; do
			[[ -z "$range" ]] && continue
			local rf="${range%%:*}"; local rr="${range#*:}"
			local lo="${rr%%:*}"; local hi="${rr##*:}"
			if [[ "$rf" == "$f" && "$ln" -ge "$lo" && "$ln" -le "$hi" ]]; then in_diff=1; break; fi
		done <<<"$added"
		if [[ $in_diff -eq 0 ]]; then
			echo "FINDING [producers] error producer matching /$shape/ on a line the diff never touched; re-check it against the narrowed classifier or acknowledge:"
			echo "  $line"
			findings=1
		fi
	done <<<"$hits"
	[[ $findings -eq 0 ]] && echo "PASS [producers] every producer matching /$shape/ sits on a changed line"
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
	producers) check_producers "$@" ;;
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
