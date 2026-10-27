# Official Mobbin connection

Credential-file mode checks apply to POSIX hosts. On Windows, Node's chmod does
not establish an owner-only ACL; keep the library in your protected user profile
or another appropriately ACL-protected directory. This toolkit does not certify
Windows credential ACLs. Account permissions and export rights remain separate.

The implementation follows Mobbin's published integration contract, not its private website backend.

- MCP: `https://api.mobbin.com/mcp`, OAuth DCR/PKCE, scope `openid`.
- Resource discovery: `https://api.mobbin.com/.well-known/oauth-protected-resource/mcp`.
- REST: `POST https://api.mobbin.com/v1/screens/search` with a workspace API key.

The official MCP supports user account authorization; the documented REST API requires a separate Team/Enterprise entitlement. An MCP OAuth token and a REST API key are not interchangeable. The current REST schema accepts only `ios` and `web`. This server exposes only its native iOS subset and rejects Android REST requests before any network call.

`npm run mobbin:login` starts an explicit interactive login. It binds the callback to loopback, validates a random state value, and delegates discovery, dynamic registration, PKCE and token exchange to the MCP TypeScript SDK. Tokens/client registration are stored with mode 0600 in `auth/mobbin.json` under `MOBILE_DESIGN_DATA_DIR`, or the default user library. The PKCE verifier remains in memory. The server can refresh saved account tokens through the SDK; when interactive sign-in is needed, its tool returns the login instruction instead of opening a browser during a tool call. A live account login is still required to validate account entitlement and actual upstream schemas.

`mobbin_list_tools` discovers actual server names and schemas. `mobbin_call` first checks discovery and forwards only a tool explicitly marked read-only by the upstream server. It does not invent expected tool names. If Mobbin omits those annotations, the bridge refuses the call; a schema-specific mapping can be reviewed after actual account discovery. REST response parsing has a 20-second deadline and a streaming 2 MiB budget. No credentials or returned screen content are saved in the local catalog. Image URLs are provider references that can expire.

Current verification: the public resource metadata was fetched; an unauthenticated MCP initialize request returned HTTP 401. Missing-credentials, unsupported-platform, bounded REST response and private token-storage paths are tested offline. Paid/authenticated searches, callback authorization and token refresh have not been exercised with a user's real account.

Sources checked 2026-10-27: [integration](https://docs.mobbin.com/mcp/build-an-integration), [REST quickstart](https://docs.mobbin.com/api/quickstart), [screen search schema](https://docs.mobbin.com/api-reference/screens/search-screens-with-natural-language), [terms](https://mobbin.com/terms). The design uses live personal/internal provider access and an independent owned-capture library; it does not mirror Mobbin into a replacement screen repository.
