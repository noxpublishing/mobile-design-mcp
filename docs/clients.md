# Windows, macOS and Linux; Claude Code and Codex

The Node MCP server, skills, documentation helpers and reviewer profiles are
designed for all three desktop operating systems. Node 22.13+ is required; use
Node 24 or newer for the tested client/install examples. Media extraction needs
`ffmpeg` and `ffprobe` on PATH. No Bash or Python is required by the installer.

| Capability | Windows | macOS | Linux |
|---|---|---|---|
| MCP stdio, local catalog, skills/docs and packet generation | Yes | Yes | Yes |
| Video studies with ffmpeg/ffprobe | Yes | Yes | Yes |
| Figma remote connection | Client/account dependent | Client/account dependent | Client/account dependent |
| Rive desktop editor MCP | Supported editor host | Supported editor host | Not currently documented by Rive |
| Android build/emulator/profiling | Android tooling required | Android tooling required | Android tooling required |
| iOS build/simulator/profiling | Use a Mac build host | Xcode required | Use a Mac build host |

This is the intended support matrix, not a claim that every external tool/account
or client session has been tested. Repository CI runs the toolkit tests on all
three OS families. Native app compilation/profiling remain per-project checks.
Remote tools need an explicitly configured reachable host; a loopback URL points
to the machine on which the client runs. Credentials remain on that environment.

## Install workflow instructions

From this checkout, the same command works in PowerShell, a Unix shell or a
client terminal:

```text
node scripts/install-workflow.mjs --client both --scope user
```

Choose `--client claude` or `--client codex` for one client. For repository-scoped
installation use `--scope project --project "ABSOLUTE_APP_PATH"`. Use a separate
app directory rather than installing generated copies inside this toolkit's source.

The installer copies an explicit instruction/resource bundle into
`<scope-root>/.mobile-design-mcp/workflow`, installs real skill folders and rebases
their toolkit references. It requires no symlink privileges or Windows Developer
Mode. Resources are an install snapshot: rerun after updating the toolkit.
Owned unmodified bundle/skill copies may be updated. Unmanaged, symlinked or
locally modified destinations are preserved and reported. Existing agent files
are preserved; review/remove an old owned profile before reinstalling to update it.
No existing client config, credentials, permissions or model choices are changed.

| Client | Skill destination | Reviewer definition destination |
|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md` | `.codex/agents/<name>.toml` |
| Claude Code | `.claude/skills/<name>/SKILL.md` | `.claude/agents/<name>.md` |

Paths are under the user home or selected app root. Codex definitions inherit
parent settings; read-only review is an instruction, not a separate permission
sandbox. Claude reviewer definitions allow Read/Glob/Grep only and therefore
inspect supplied evidence rather than execute builds. The parent collects runtime
evidence. Client versions and workspace/organization policies can affect discovery;
restart and verify the installed skills/agents. Portable profiles remain usable
by explicit fresh-context dispatch if a client cannot register custom agents.

Start setup with `$mobile-setup` in Codex or `/mobile-setup` in Claude Code.
Then use `mobile-design` for implementation and the focused skills as needed.
Setup documents one project, reuses answers and resumes after changes.

Official references: [Codex skills](https://developers.openai.com/codex/skills),
[Codex agents](https://developers.openai.com/codex/subagents),
[Claude Code skills](https://code.claude.com/docs/en/skills),
[Claude Code agents](https://code.claude.com/docs/en/sub-agents).

## Connect the runtime

Workflow installation does not connect the MCP server. Build the original checkout
with `npm ci --ignore-scripts` and `npm run build`, then configure a stdio server
with command `node` and argument equal to the absolute `dist/cli.js` path.
Use the client environment's actual executable if `node` is not on its PATH.
The portable [Claude configuration example](../examples/claude.mcp.json) and
[Codex example](../examples/codex.toml) show the shape; replace placeholder paths.
On Windows use forward slashes in JSON/TOML paths, or escape backslashes.
Install media tools with the OS's package manager and verify both executable
names on PATH. CI installs them separately for each runner OS.

The default library is in the home-directory `.local/share/mobile-design-mcp`
on each OS for compatibility. `MOBILE_DESIGN_DATA_DIR` selects another path.
Mobbin sign-in, Figma connection and Rive editor connection remain separate
explicit integrations. See their source-specific docs. No account connection is
certified merely because it appears in a sample configuration.
