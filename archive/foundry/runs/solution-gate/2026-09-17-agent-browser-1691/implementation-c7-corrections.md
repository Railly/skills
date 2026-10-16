# Required implementation correction after C7

The first Claude implementation began under C1-C6. Independent feedback required C7; timing-feedback.md now grants pass-to-detail on C7. Implement this correction after the current worker finishes, before reduction/hardening/tests are accepted.

1. Add Browser Use-only 22s complete setup deadlines around both auto_launch and handle_launch/relaunch; timeout rollback outside the canceled setup is bounded to4s. Independent navigation/action stays outside. Fix retained ownership before ANY new awaited postallocation work.
2. close_active_provider_session currently take()s then restores on Err. This loses the ID on cancellation. Borrow as_ref across stop; take/clear only after acknowledgment. Add a forced cancellation test at that await.
3. New receipt work currently synchronous. Move preflight/write off runtime thread with spawn_blocking and await within setup budget. A callback/sink must store a parsed UUID in actual DaemonState BEFORE awaiting receipt write, not a local variable dropped with the setup future. Preserve callback state on failure/cancel and clear only after acknowledged rollback. A small Browser Use-specific owned connector from actions to providers can provide this callback without changing other providers. Existing generic provider wrappers can retain no-op owner for non-daemon callers. Avoid a new global test override or extra state machine.
4. Receipt create_dir_all is not writability preflight for an existing unwritable directory. Probe an exclusive temporary file before allocating, then remove. Any late receipt write after canceled async work is a conservative manual record, never replayed.
5. Stop receipt deletion after acknowledgment must not turn ack into timeout/error. Schedule best-effort removal without waiting on filesystem indefinitely; a stale receipt is acceptable and documented.
6. Validate stop returned id as UUID equality (case representations should compare equal). Compare returned ID to credential before printing/persisting if key may itself be UUID-shaped. Do not reflect server bodies/URLs/keys.
7. Non2xx 5xx create failures can have ambiguous remote outcome; add fixed Cloud inspection guidance and no retry. Validate CDP endpoint scheme ws/wss and nonempty host before connection or preserve safe generic failure cleanup.

No source changed by parent during the worker's ownership. These are concrete follow-up changes, not a report of completed fixes. Use the existing test harness where practical and invalidate earlier tests after production changes.
