# Contributing

Use Node 22.13+ and ffmpeg/ffprobe. Run `npm ci --ignore-scripts` and `npm test` before proposing changes. Keep provider credentials, local captures, generated review packets and runtime profiles outside version control; `.artifacts/` and the user library are local-only.

Preserve existing tool and record semantics when adding workflow capabilities. Capture bytes and capture context are distinct identities. A reference flow does not prove an implemented user task. New evidence needs a revision/platform/state and stale conclusions must be rechecked.

Provider integrations must follow documented contracts, bound their network reads and report unavailable/unsupported capabilities explicitly. Do not add a mirrored third-party screen collection, invent native performance measurements, or claim app verification from generated code.

The shared completion contract is `docs/workflow.md`; keep both skills and generated brief guidance aligned with it. Original runtime code uses the Noncommercial Study License in `LICENSE`. Explicitly marked adapted workflow instructions remain Apache-2.0; retain applicable notices. Submit contributions only if you can license them under the terms applicable to the changed files. Do not upload third-party captures or assets without the required permission. See `docs/usage-rights.md` for scope and provider-content boundaries.
