#!/usr/bin/env bash
# Deterministic layer of the review gate. Every check is binary: exit 0 (pass) or 1 (findings).
# Run from inside the target repository.
set -uo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
  gate.sh timings [<base-ref>] [<path>...]    Every timing constant the diff adds (a ceiling, timeout, or deadline in ms)
                                              is listed against every larger timing constant in the same search space;
                                              each larger one is cleared or acknowledged
  gate.sh shellmeta [<base-ref>] [<path>...]  A shell-metacharacter detector the diff adds or edits must cover every
                                              construct that changes command parsing, not only the separators
                                              (`#` comment, `(`/`)` subshell, `` ` ``/`$(` substitution), or acknowledge each
  gate.sh artifacts <cleanup-source> [<base-ref>] [<path>...]
                                              Every persistent filename the diff starts writing must appear in the
                                              source that removes them (a clean command's allowlist); a written path
                                              with a dynamic component cannot be matched by a static list at all
  gate.sh rawinput <accessor> [<base-ref>] [<path>...]
                                              When a diff deepens a resolution rule, every site that re-derives the answer
                                              inline from the raw input, on a line the diff never touched, is updated or acknowledged
  gate.sh flagsweep <new-flag> <sibling-flag> [<base-ref>] [<path>...]
                                              A flag the diff introduces must appear on every doc surface that already
                                              documents a comparable sibling flag. The surface map is keyed on code paths,
                                              so a doc page reachable only by feature name is invisible to it
  gate.sh execdeps <conventions.md> [<base-ref>]
                                              Added external executables must have their provider package in every
                                              first-party installer and sandbox bootstrap named by the execdeps map
  gate.sh covered <runs-dir> [<pr>]           A run report for the exact HEAD sha must exist; a rebase or force-push
                                              retires every earlier report, including the one that found the bugs
                                              this head claims to fix
  gate.sh report <run-report.json> [--structural]
                                              Validate that a complete report proves properties directly, verifies
                                              assumptions, covers every post-commit failure stage and retry, and has
                                              an independent challenge source when high risk. --structural skips
                                              exact checkout HEAD and diff-signal checks for schema fixtures only
  gate.sh render <run-report.json> [output.md]
                                              Generate the human report deterministically from schema-v1 JSON
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

# Timing sweep: a wait ceiling the diff adds is only correct against the
# worst-case cadence of whatever it waits on, and that cadence lives in another
# constant the author did not necessarily remember. This enumerates every
# millisecond constant in the search space that is LARGER than a ceiling the
# diff adds; each is cleared ("cannot gate my event") or acknowledged. Full
# recall on its class: the constants are named and greppable.
# Provenance: portless #367 round 4 (ctate-confirmed): a 1500ms CLI poll ceiling
# sized against DEBOUNCE_MS=100 while the daemon's watcher fallback ran at
# POLL_INTERVAL_MS=3000, same file, 550 lines away.
check_timings() {
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	# A "ceiling" is a bound on how long we wait: only CEILING/TIMEOUT/DEADLINE/
	# WAIT names qualify. Bare intervals and durations are cadences, not bounds,
	# and flagging them buries the real finding in noise.
	local ceiling_re='[A-Za-z_][A-Za-z0-9_]*([Cc]eiling|CEILING|[Tt]imeout|TIMEOUT|[Dd]eadline|DEADLINE|MaxWait|MAX_WAIT)[A-Za-z0-9_]*'
	# Any millisecond constant, ceiling or cadence: the comparison set.
	local any_re='[A-Za-z_][A-Za-z0-9_]*(_MS|_TIMEOUT|_CEILING|Ms|MS)[[:space:]]*[:=][[:space:]]*[0-9_]+'
	# Files the diff touches: the producer's constants live where the producer
	# lives, and a repo-wide set drowns the signal (portless: 16 unrelated
	# timeouts around the one that mattered, POLL_INTERVAL_MS in the same file).
	local changed_files
	changed_files=$(git diff --name-only "$base" -- "${@:-.}" 2>/dev/null | grep -vE '(test|spec)\.' || true)
	local added_consts
	added_consts=$(git diff "$base" --unified=0 -- "${@:-.}" 2>/dev/null |
		grep -E '^\+' | grep -vE '^\+\+\+' |
		grep -oE "${ceiling_re}[[:space:]]*[:=][[:space:]]*[0-9_]+" |
		sed -E 's/[[:space:]]*[:=][[:space:]]*/ /' | sort -u || true)
	# A ceiling bound to an expression over other constants is the shape this
	# gate wants authors to reach; it has no literal to compare, so report it
	# for a read instead of letting it read as "no ceiling added".
	local derived
	derived=$(git diff "$base" --unified=0 -- "${@:-.}" 2>/dev/null |
		grep -E '^\+' | grep -vE '^\+\+\+' |
		grep -oE "${ceiling_re}[[:space:]]*[:=][[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*[-+*][^;,)]*" | sort -u || true)
	if [[ -n "$derived" ]]; then
		echo "NOTE [timings] ceiling derived from other constants; confirm the operands are the producer's worst case:"
		printf '    %s\n' "$derived"
	fi
	if [[ -z "$added_consts" ]]; then
		if [[ -n "$derived" ]]; then
			echo "PASS [timings] every added ceiling is derived, none is a bare literal"
		else
			echo "PASS [timings] the diff adds no wait ceiling"
		fi
		return 0
	fi
	local all_consts=""
	while IFS= read -r f; do
		[[ -z "$f" || ! -f "$f" ]] && continue
		all_consts+=$(grep -hoE "$any_re" "$f" 2>/dev/null |
			sed -E 's/[[:space:]]*[:=][[:space:]]*/ /' | tr -d '_')$'\n'
	done <<<"$changed_files"
	all_consts=$(printf '%s' "$all_consts" | sort -u)
	while read -r name value; do
		[[ -z "${name:-}" ]] && continue
		local clean_value="${value//_/}"
		local larger
		larger=$(while read -r oname ovalue; do
			[[ -z "${oname:-}" || "$oname" == "${name//_/}" ]] && continue
			[[ "$ovalue" -gt "$clean_value" ]] && echo "    $oname = $ovalue"
		done <<<"$all_consts")
		if [[ -n "$larger" ]]; then
			echo "FINDING [timings] '$name = $clean_value' bounds a wait; these timing constants in the changed files are larger and may gate the event it waits for. Clear each ('cannot delay my event') or acknowledge:"
			printf '%s\n' "$larger"
			findings=1
		fi
	done <<<"$added_consts"
	[[ $findings -eq 0 ]] && echo "PASS [timings] every added ceiling clears the timing constants in the changed files"
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

# shellmeta: when a diff adds or edits a detector that scans a string for shell
# metacharacters, the detector's character set is the artifact under test. Detectors
# written from a bug report enumerate SEPARATORS (what starts a new command) and stop
# there, because that is the class the report named. The classes that survive are the
# ones that change parsing without starting a command: `#` (everything after it is a
# comment, so appended arguments are silently discarded), `(`/`)` (subshell), and
# `` ` ``/`$(` (command substitution). Provenance: portless #366 round 4: the
# quote-aware isCompoundShellScript covers ; | & newline and quoting, and a script
# ending in a comment swallowed every injected --port/--host, producing a 502.
check_shellmeta() {
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	# Files whose added lines test a string for a shell metacharacter. The class
	# includes the tail-discarding constructs, not only the separators: a diff
	# that EDITS an existing detector (adding a `#` branch, say) never touches
	# the separator lines, so a separator-only trigger reads it as "no detector
	# added" and passes. Self-caught on the #366 round 4 fix.
	local candidates
	candidates=$(git diff "$base" -- "${@:-.}" 2>/dev/null | awk '
		/^\+\+\+ /{ f=$2; sub(/^b\//,"",f); next }
		/^\+/ && !/^\+\+\+/ { if (f != "" && $0 ~ /["'"'"']([;|&#()`]|\\n)["'"'"']/) print f }' | sort -u)
	if [[ -z "$candidates" ]]; then
		echo "PASS [shellmeta] diff adds no shell-metacharacter detector"
		return 0
	fi
	local construct
	while IFS= read -r f; do
		[[ -z "$f" ]] && continue
		grep -qiE "test|spec" <<<"$f" && continue
		for construct in '#' '(' '`' '$('; do
			if ! grep -qF -- "\"$construct\"" "$f" 2>/dev/null && ! grep -qF -- "'$construct'" "$f" 2>/dev/null; then
				echo "FINDING [shellmeta] $f detects shell separators but never tests for '$construct'; a script containing it re-parses differently than the detector assumes (appended args after '#' are discarded), or acknowledge why it is unreachable"
				findings=1
			fi
		done
	done <<<"$candidates"
	[[ $findings -eq 0 ]] && echo "PASS [shellmeta]"
	return $findings
}

# covered: a run report must exist for the exact tree being pushed. A rebase or
# force-push rewrites shas, so the report that found round N's bugs describes a tree
# that is no longer an ancestor of HEAD, and the commit that FIXES those findings is
# by construction the least-reviewed commit on the branch. Provenance: portless #366
# round 4: the last report was cf596be, retired by a force-push; the fix commit
# 1aba57e was never gated and shipped three defects.
# A new flag is documented wherever a comparable flag already is.
#
# `surfaces` keys on code paths the diff touches, so a doc page that no code
# path points at stays invisible; `siblings` keys on a keyword that, for a
# brand-new flag, exists nowhere else yet. Both pass while a page listing the
# new flag's neighbours says nothing about it. The sibling flag supplies the
# search space the other two cannot derive.
check_flagsweep() {
	local newflag="${1:-}" sibling="${2:-}"
	[[ -z "$newflag" || -z "$sibling" ]] && usage
	shift 2
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")

	local hits
	hits=$(git grep -lI --untracked -e "$sibling" -- "${@:-.}" 2>/dev/null || true)
	if [[ -z "$hits" ]]; then
		echo "ERROR [flagsweep] sibling '$sibling' appears in no file; pick a flag that is already documented"
		return 2
	fi

	while IFS= read -r f; do
		[[ -z "$f" ]] && continue
		case "$f" in
		*.lock | */Cargo.lock | *.json) continue ;;
		esac
		if ! grep -qF -- "$newflag" "$f" 2>/dev/null; then
			echo "FINDING [flagsweep] '$f' documents '$sibling' but never mentions '$newflag'; add it or acknowledge why that surface is unaffected"
			findings=1
		fi
	done <<<"$hits"

	if [[ "$findings" -eq 0 ]]; then
		echo "PASS [flagsweep] every surface documenting '$sibling' also mentions '$newflag'"
	fi
	return "$findings"
}

check_execdeps() {
	local conv="${1:-}"
	[[ -z "$conv" || ! -f "$conv" ]] && { echo "execdeps: conventions file not found: ${conv:-<missing>}"; return 2; }
	local base findings=0
	base=$(base_ref "${2:-}")
	local rules
	rules=$(awk '/^```execdeps/{f=1;next}/^```/{f=0}f' "$conv" | grep -vE '^\s*(#|$)' || true)
	[[ -z "$rules" ]] && { echo "PASS [execdeps] no executable dependency map in $conv"; return 0; }

	while IFS= read -r rule; do
		local executable source package installers source_added
		executable="$(printf '%s' "$rule" | awk -F' :: ' '{print $1}')"
		source="$(printf '%s' "$rule" | awk -F' :: ' '{print $2}')"
		package="$(printf '%s' "$rule" | awk -F' :: ' '{print $3}')"
		installers="$(printf '%s' "$rule" | awk -F' :: ' '{print $4}')"
		if [[ -z "$executable" || -z "$source" || -z "$package" || -z "$installers" ]]; then
			echo "ERROR [execdeps] malformed rule: $rule"
			return 2
		fi
		source_added=$(git diff "$base" --unified=0 -- $source 2>/dev/null |
			grep -E '^\+' | grep -vE '^\+\+\+' | grep -F -- "$executable" || true)
		[[ -z "$source_added" ]] && continue

		IFS=',' read -ra installer_patterns <<<"$installers"
		for pattern in "${installer_patterns[@]}"; do
			pattern="$(echo "$pattern" | xargs)"
			local matches
			matches=$(git ls-files -- "$pattern")
			if [[ -z "$matches" ]]; then
				echo "FINDING [execdeps] '$executable' is added under '$source' but installer '$pattern' does not exist"
				findings=1
				continue
			fi
			while IFS= read -r installer; do
				[[ -z "$installer" ]] && continue
				if ! grep -Eq -- "$package" "$installer"; then
					echo "FINDING [execdeps] '$executable' is added under '$source' but '$installer' installs no package matching /$package/"
					findings=1
				fi
			done <<<"$matches"
		done
	done <<<"$rules"

	[[ $findings -eq 0 ]] && echo "PASS [execdeps] every added external executable is installed by each mapped first-party setup"
	return $findings
}

check_covered() {
	local runs="${1:-}"
	[[ -z "$runs" ]] && usage
	local sha short
	sha=$(git rev-parse HEAD)
	short=$(git rev-parse --short HEAD)
	if [[ ! -d "$runs" ]]; then
		echo "ERROR [covered] runs directory not found: $runs"
		return 2
	fi
	if ls "$runs" | grep -q -- "$short"; then
		echo "PASS [covered] run report exists for HEAD $short"
		return 0
	fi
	echo "FINDING [covered] no run report for HEAD $short in $runs"
	local prior
	prior=$(grep -lE '"(head|sha)"[[:space:]]*:' "$runs"/*.json 2>/dev/null | while IFS= read -r r; do
		local h
		h=$(sed -nE 's/.*"(head|sha)"[[:space:]]*:[[:space:]]*"([0-9a-f]{7,40})".*/\2/p' "$r" | head -1)
		[[ -z "$h" ]] && continue
		if git rev-parse --verify --quiet "$h^{commit}" >/dev/null 2>&1 &&
			! git merge-base --is-ancestor "$h" "$sha" 2>/dev/null; then
			echo "  unreachable: $(basename "$r") reviewed $h, not an ancestor of HEAD (rebased, force-pushed, or a different branch)"
		fi
	done)
	[[ -n "$prior" ]] && echo "$prior"
	return 1
}

check_report() {
	local report="${1:-}"
	[[ -z "$report" ]] && usage
	shift || true
	node "$script_dir/validate-run-report.mjs" "$report" "$@"
}

# rawinput: when a diff deepens a resolution or discovery rule (the resolver now looks
# through a package script, a runner wrapper, a config indirection), every OTHER site
# that re-derives the same answer inline from the raw input still applies the shallow
# rule. Those sites are invisible to `callers`, because they never call the resolver.
# Line-level like `producers`: the sites live on untouched lines of files the diff also
# changes. Provenance: portless #366 round 4: a blind reviewer ran the
# resolution-rule-consistency lens, opened both files, and still missed
# `path.basename(commandArgs[0])` in the env binder. The lens said to grep the raw
# input; judgment did not do it, so the sweep became a check.
check_rawinput() {
	local accessor="${1:-}"
	[[ -z "$accessor" ]] && usage
	shift
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	local added
	added=$(git diff -U0 "$base" -- "${@:-.}" 2>/dev/null | awk '
		/^\+\+\+ /{ f=$2; sub(/^b\//,"",f); next }
		/^@@ /{ split($3,a,","); s=a[1]; sub(/^\+/,"",s); n=(a[2]==""?1:a[2]); if(n>0) print f":"s":"(s+n-1) }')
	local hits
	hits=$(git grep -nIF "$accessor" -- "${@:-.}" 2>/dev/null || true)
	if [[ -z "$hits" ]]; then
		echo "ERROR [rawinput] no reads of '$accessor' found; check the accessor and pathspec"
		return 2
	fi
	while IFS= read -r line; do
		[[ -z "$line" ]] && continue
		grep -qiE "\.test\.|_test\.|/tests?/|spec\." <<<"$line" && continue
		local f="${line%%:*}" rest ln in_diff=""
		rest="${line#*:}"
		ln="${rest%%:*}"
		while IFS= read -r range; do
			[[ -z "$range" ]] && continue
			local rf="${range%%:*}" rr="${range#*:}"
			[[ "$rf" != "$f" ]] && continue
			local s="${rr%%:*}" e="${rr##*:}"
			if ((ln >= s && ln <= e)); then in_diff=1; break; fi
		done <<<"$added"
		[[ -n "$in_diff" ]] && continue
		echo "FINDING [rawinput] $f:$ln re-derives from '$accessor' on a line the diff never touched; apply the deepened rule here or acknowledge why the shallow one is still correct"
		findings=1
	done <<<"$hits"
	[[ $findings -eq 0 ]] && echo "PASS [rawinput]"
	return $findings
}

# A persistent artifact the diff starts writing must be registered with whatever
# removes it. The two sides are joined by nothing but a hardcoded list, so they
# drift silently: the writer works, the remover is simply unaware, and no test
# fails. Dynamic names (a pid or timestamp spliced into the filename) are worse
# than unregistered: a static allowlist cannot express them at all.
check_artifacts() {
	local cleanup="${1:-}"
	[[ -z "$cleanup" ]] && usage
	shift
	local ref=""
	if [[ -n "${1:-}" ]] && git rev-parse --verify --quiet "$1^{commit}" >/dev/null 2>&1; then
		ref="$1"
		shift
	fi
	local base findings=0
	base=$(base_ref "$ref")
	if ! git grep -qI . -- "$cleanup" 2>/dev/null; then
		echo "ERROR [artifacts] cleanup source not found or empty: $cleanup"
		return 2
	fi
	# Tests write scratch files by design and clean up after themselves; excluded
	# by path, not by line content, or a test's own temp prefix reads as a finding.
	local added
	added=$(git diff "$base" --unified=0 -- "${@:-.}" \
		':(exclude)*.test.*' ':(exclude)*.spec.*' ':(exclude)*/tests/*' ':(exclude)*/test/*' 2>/dev/null |
		grep -E '^\+' | grep -vE '^\+\+\+' || true)
	# Only lines that build or write a path: this is what separates a state
	# filename from an import specifier or an encoding argument.
	local write_re='path\.join|path::join|PathBuf|writeFileSync|appendFileSync|createWriteStream|renameSync|openSync|writeFile\(|fs::write|File::create'
	# A filename rarely sits on the line that writes it: the idiom is a named
	# constant declared far from its use. Take both, or the gate reads a
	# `path.join(dir, HOSTS_SYNC_STATUS_FILE)` and learns nothing.
	local name_re='(const|let|var|static|final)[^=]*(FILE|File|PATH|Path|NAME|Name|_file|_path)[^=]*=[^=]*'
	local decl_lines
	decl_lines=$(grep -E "$name_re" <<<"$added" || true)
	local path_lines
	path_lines=$(grep -E "$write_re" <<<"$added" || true)
	if [[ -z "$path_lines" && -z "$decl_lines" ]]; then
		echo "PASS [artifacts] the diff writes no new path"
		return 0
	fi
	# A dynamic component counts only inside the path expression itself. Judge
	# the interpolated segment, never the whole line: `writeFileSync(pidPath,
	# `${process.pid}\n`)` interpolates into the file's *contents* and names
	# nothing, while `${target}.${process.pid}.tmp` names a file no static list
	# can enumerate.
	local dynamic
	dynamic=$(grep -oE '`[^`]*`|format!\([^)]*\)' <<<"$added" |
		grep -E '\$\{|\{\}' |
		grep -E '\.(tmp|lock|log|pid|json|sock|part|bak|swp)([^A-Za-z0-9]|$)' |
		sort -u || true)
	# Prefix removal is the correct answer to a dynamic name, so recognize it
	# rather than demanding an acknowledgement for a fix that already landed.
	local prefix_removal=""
	git grep -qIE 'startsWith|starts_with|glob|readdir|read_dir' -- "$cleanup" 2>/dev/null &&
		prefix_removal=1
	if [[ -n "$dynamic" && -z "$prefix_removal" ]]; then
		echo "FINDING [artifacts] a written path carries a dynamic component, which no static cleanup allowlist can match. Remove by prefix, or acknowledge why the file cannot outlive the process:"
		printf '    %s\n' "$dynamic"
		findings=1
	elif [[ -n "$dynamic" ]]; then
		echo "NOTE [artifacts] a written path carries a dynamic component and $cleanup does remove by prefix; confirm the prefix covers it:"
		printf '    %s\n' "$dynamic"
	fi
	local candidates
	candidates=$(printf '%s\n%s\n' "$path_lines" "$decl_lines" |
		grep -oE '"[A-Za-z0-9_.-]+"|'"'"'[A-Za-z0-9_.-]+'"'"'' |
		tr -d "\"'" |
		grep -E '[.-]' |
		grep -vE '^(utf-?8|utf-?16|base64|hex|ascii|binary|latin1|r|w|a|w\+|r\+|a\+)$' |
		grep -vE '^\.+$' |
		# A single-segment dotfile name (".portless", ".cache") is the state
		# directory itself, not an artifact inside it.
		grep -vE '^\.[A-Za-z0-9_-]+$' |
		sort -u || true)
	while IFS= read -r name; do
		[[ -z "$name" ]] && continue
		git grep -qIF "$name" -- "$cleanup" 2>/dev/null && continue
		# Sharing a named constant between the writer and the remover is the
		# stronger fix than repeating the literal in both, so resolve the name
		# to the identifier bound to it and look for that too. Without this the
		# gate reports a finding against the very coupling it exists to ask for.
		local ident=""
		ident=$(git grep -hIE "^[[:space:]]*(export[[:space:]]+)?(const|let|var|static|final|pub[[:space:]]+const)[[:space:]]+[A-Za-z_][A-Za-z0-9_]*[^=]*=[[:space:]]*[\"']${name}[\"']" |
			grep -oE '(const|let|var|static|final)[[:space:]]+[A-Za-z_][A-Za-z0-9_]*' |
			awk '{print $2}' | sort -u | head -1 || true)
		if [[ -n "$ident" ]] && git grep -qIw "$ident" -- "$cleanup" 2>/dev/null; then
			continue
		fi
		echo "FINDING [artifacts] '$name' is written by the diff and absent from $cleanup; register it for cleanup or acknowledge why it must survive"
		findings=1
	done <<<"$candidates"
	[[ $findings -eq 0 ]] && echo "PASS [artifacts] every filename the diff writes is known to $cleanup"
	return $findings
}

cmd="${1:-}"
shift || true
case "$cmd" in
	shellmeta) check_shellmeta "$@" ;;
	artifacts) check_artifacts "$@" ;;
	rawinput) check_rawinput "$@" ;;
	flagsweep) check_flagsweep "$@" ;;
	execdeps) check_execdeps "$@" ;;
	covered) check_covered "$@" ;;
	report) check_report "$@" ;;
	render) bun "$script_dir/render-run-report.mjs" "$@" ;;
	style) check_style "$@" ;;
	stale) check_stale "$@" ;;
	surfaces) check_surfaces "$@" ;;
	siblings) check_siblings "$@" ;;
	callers) check_callers "$@" ;;
	producers) check_producers "$@" ;;
	timings) check_timings "$@" ;;
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
