# Resilience audit: wterm #116 post-fix

Date: 2026-08-12
Base HEAD: `4852dde5481439883eecf7f61f32f6091be5b468`
Tracked product-diff fingerprint: `ce4c7a8fb0cccd8ddd48bcf3d67b1fc8b6a1dcf249efa6057790fc1000783c61`
Verdict: **pass**

The three pre-fix findings were forced again:

- Frame-separated rollover: preserved logical row and one measured adjustment, 5/5 focused and 15/15 full serial Chromium.
- Built-in saturation: capacity 1024, used 1024, rejected 1, saturated true; RIS preserved state and init reset it.
- Ghostty retention: 1600 unique reads produced no retained JavaScript Map above 64 entries.

Additional failure paths:

- Rejection counter stayed at `u32::MAX` under another rejection.
- A simulated older WASM without the new resource exports returned `{}`.
- The apparent resize regression was an invalid oracle that read before the scheduled virtual-window render. Synchronizing the test restored the full suite without another product fix.

Full evidence is in:

```text
/Users/raillyhugo/Programming/vercel/wterm-osc8/resilience-audit/2026-08-12-pr-116-post-fix/report.md
/Users/raillyhugo/Programming/vercel/wterm-osc8/resilience-audit/2026-08-12-pr-116-post-fix/report.json
```

Remaining gaps: long-duration RSS/GC, transport disconnect/reconnect, and exact-head review after commit.
