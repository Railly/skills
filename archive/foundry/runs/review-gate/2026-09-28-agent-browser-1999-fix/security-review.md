# Security review

Assets are the supplied username/password, the intended origin, and exact selected DOM controls. The lower-trust input is page DOM and focus state; the sensitive sink is credential insertion. The old focus-based path could deliver a credential to another same-origin field after replacement. The fixed path resolves an exact backend node, validates it at insertion time, and rejects before submit when identity or focus changes.

A same-origin page script already has authority to inspect credentials entered into its page, so the reproduced decoy-field behavior is a correctness and hardening issue rather than a new cross-origin privilege boundary. The change adds no credential logging, persistence, network destination, origin relaxation, or public input surface. Cross-origin no-navigate behavior remains covered. No security blocker remains.
