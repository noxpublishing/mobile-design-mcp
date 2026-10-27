# Native design reference pipeline

```mermaid
flowchart TD
  A[Official award metadata] --> C[Local SQLite / FTS5 catalog]
  L[Owned screenshots and recordings] --> R[Hashed local media]
  R --> F[User-annotated flows]
  R --> M[Time-indexed frame studies]
  B[Official Mobbin MCP / REST] --> V[Live provider response]
  C --> D[Agent design brief]
  F --> D
  M --> D
  V --> D
  D --> N[SwiftUI or Jetpack Compose project]
  P[Authored motion recipes] --> N
  N --> Q[Target-device verification]
  Q --> S[Final app screenshots and clips]
  S --> W[Optional mobile-showcase skill]
```

`server.ts` defines the MCP contract. `store.ts` persists app references, owned media records, flow annotations and refresh metadata. `awards.ts` and `google-awards.ts` fetch explicitly bounded official listings. `media.ts` validates/imports files and extracts video study frames. `recipes.ts` supplies authored native examples with platform prerequisites. `mobbin.ts` is an account-connected live provider; its results are not stored in SQLite. `mobbin-login.ts` owns the explicit user sign-in workflow.

The design keeps observed metadata, user annotations, inferred interpretations and authored code distinct. Screenshots have no timing evidence. A selected video interval is not a measured transition duration. Haptics and original spring/easing values remain unknown unless new evidence can establish them. There is deliberately no single similarity or "award quality" score. Native build/render verification is a later app-project operation.

The two skills are separate: `mobile-design` guides native app work; `mobile-showcase` applies only after design completion and an authorized website phase. The latter can use Awwwards tools for web references when available, while all showcased app screens must come from the finished app. The optional site does not drive changes back into the app implicitly.
