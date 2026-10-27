# Reference sources

The first provider reads the public [Apple Design Awards listing](https://developer.apple.com/design/awards/). It records recognition, source links and observation time. It does not claim to have observed an app's current screens or motion.

## Implemented: Apple Design Awards

`refreshAppleAwards({ year? })` fetches the current listing. The optional year is an expectation checked against the page's declared year. It does not select a guessed historical URL. A future change of the root listing therefore fails explicitly when a caller requests an older year.

`parseAppleAwards(html, sourceUrl, observedAt, year?)` supports offline ingestion of a previously obtained listing with its explicit URL and observation time. The page title/header must declare one unambiguous award year; the clock and a requested year are never used to fill missing evidence.

A record is admitted only when the source contains:

- A category section and an explicit `Apps` group.
- An App Store link with a numeric app identity and a title.
- An explicit iOS or iPadOS platform label.

The internal `ios` platform groups iOS and iPadOS in this first schema. It does not independently assert iPhone compatibility for an iPad-only listing. Games, unclassified groups, missing identities and entries listed only for macOS, visionOS, watchOS or tvOS are excluded. A `Winner` badge applies only to that card; the remaining admitted cards are finalists. Repeated App Store identities merge recognition across categories without upgrading a finalist recognition to winner.

Each award stores issuer, source year, category, winner/finalist status and category URL. Each app stores its source provider, URL and observation timestamp. Tags derive only from category, year and recognition status. App genres, current app versions, framework choices and animation timings are not inferred.

The provider returns no media by default. CSS icons and a category's shared promotional video are not silently recast as app-specific screenshots or transition evidence. An award applies to the source year's recognition; a later recording of that app must retain its own version and capture time.

A live read on 27 October 2026 yielded 12 distinct iOS/iPadOS app identities from the 2026 page, including four category-winner apps and the remaining finalists. Tide Guide carried two separate recognitions. This is an observation of that listing, not a permanent corpus count.

## Fetch boundary

The request has a 10-second deadline through body reading, using one abort signal. Its 4 MiB response limit is checked while consuming the stream, as well as against a declared content length. Redirects are followed manually, at most three times, only after verifying HTTPS, the exact `developer.apple.com` hostname and the `/design/awards/` path. Off-domain redirect targets are rejected before they are requested. Non-HTML responses, HTTP errors, ambiguous years and a completely empty parse produce explicit failures. There is no automatic crawl, media download, app-page hydration or network retry.

Markup is a dependency: the parser recognizes the present category, `h3`, `.finalist`, `h4`, `.badge` and platform-label structure. A successful partial parse cannot prove that all source cards survived a future layout change. Offline fixtures cover association, deduplication, filtering, year provenance, redirects and streaming bounds.

## Implemented: Android source from Google Play

[Google Play's Best of 2025 announcement](https://blog.google/products-and-platforms/platforms/google-play/best-apps-games-2025/) is an official source for broad app and game recognitions. It includes categories such as overall app, personal growth and multi-device. Those are not interchangeable with a dedicated UI design award. Region and year affect the selected products.

`refreshGooglePlayAwards()` reads that dated U.S. announcement with the same streaming size/deadline discipline. It admits general phone-app categories with explicit Google Play app identities, excluding games and watches, cars, large-screen, XR and multi-device categories. Issuer, category, region, year, source and observation time are retained. It does not label these as visual-design awards. A live read on 27 October 2026 yielded five Android app identities; Focus Friend has two separate recognitions. The provider deliberately does not claim to discover the latest year automatically.

## Other reference channels

Imported screenshots and screen recordings form a separate evidence channel. They can supply current interface examples and flows, while awards supply recognition metadata. Linking them by app identity does not prove that a captured version was the awarded version.

Mobbin's official service integration is handled separately from this provider. Its authenticated results must not be relabelled as publicly crawled Apple records. Own or otherwise usable recordings keep their source, capture time, app version when known and the limits of what can be measured from them.
