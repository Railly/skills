# Portless #374 independent challenge

Date: 2026-08-28

Reviewed staged tree: `a14bcb0321d822478d8d15b7911689b6a9a13060`

The exact immutable tree was challenged by independent fx passes using the
explicit permitted model `anthropic/claude-sonnet-5`. Cursor was not used.

- Test Strength: `/tmp/portless374-rerun-test-strength.md`, exit `0`. Four
  required mutants were applied in a disposable copy, killed at the intended
  assertion, restored from snapshots, and followed by 903 passing tests.
- Domain lens: `/tmp/portless374-review-lens-domain.md`, exit `0`. It confirmed
  the one-address resolver contract and centralized consumers. Its `doctor`
  coverage suggestion was adjudicated as an issue candidate because that
  caller is pre-existing, inherits the verified shared helper, and is outside
  frozen acceptance A5.
- Topology lens: `/tmp/portless374-review-lens-topology.md`, exit `0`, verdict
  PASS. It independently traced CLI versus daemon emission, the four explicit
  hosts-sync outcomes, and the 500 ms versus 3500 ms timeout ownership.
- Authority lens: `/tmp/portless374-review-lens-authority.md`, exit `0`, verdict
  PASS. It independently traced loopback endpoint authority, proxy listener
  parity, side effects, and cleanup ownership.

Root additionally verified Node 24 resolver parity on macOS and Linux in
`/tmp/portless374-cross-platform-dns.txt`. Both substrates accept only
`127.0.0.1` and `::1` from the tested literals. Windows resolver execution was
not performed and is not claimed.

The docs lens candidate was refuted at its claim layer. CLI help already states
automatic hosts synchronization and registering-command warning delivery in
the canonical `Safari / DNS` passage and again in `portless hosts --help`.
Repeating the same warning in `How it works` and `LAN mode` is not required by
the review rule, which asks for one canonical declaration per file.

No blocking behavioral or standards finding remained after adjudication.
