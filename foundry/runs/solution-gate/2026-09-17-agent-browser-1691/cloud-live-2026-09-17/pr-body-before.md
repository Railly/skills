Moves the Browser Use provider to Cloud V4. Provider setup now has bounded deadlines, and a failed or canceled stop keeps the browser ID available for retry instead of reporting a successful close. Recovery receipts omit API keys and CDP credentials.

Based on Magnus Müller’s work in #1691, with coauthor credit preserved. This is a separate implementation PR.

Validation: 1,410 Rust tests, an additional real-Chrome continuity test, docs build, and seven regression mutations passed. The published tree is identical to the validated tree. Live Browser Use Cloud billing, profiles, recording, and repeated-stop behavior remain unverified; broader fuzz and platform coverage are still outstanding.
