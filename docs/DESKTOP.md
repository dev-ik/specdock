# Desktop

SpecDock desktop is an Electron beta built around the existing local-first web
workspace and Fastify API.

## Development

```bash
nvm use
npm install
npm run desktop:dev
```

The desktop build bundles Electron main and preload code with esbuild, builds
the web app, and serves the bundled web assets through the embedded Fastify API.

## Packaging

Create an unsigned unpacked artifact for local smoke testing:

```bash
npm run desktop:package:dir
```

Workspace scripts are also available for platform artifacts:

```bash
npm run package:mac --workspace @specdock/desktop
npm run package:win --workspace @specdock/desktop
npm run package:linux --workspace @specdock/desktop
```

Installable files are created under `apps/desktop/release/desktop`:

- macOS: `.dmg` for installation and `.zip` for direct app distribution.
- Windows: `.exe` NSIS installer and `.zip`.
- Linux: `.AppImage` and `.tar.gz`.

Packaging is unsigned by default for local and GitHub open-source builds. Set
Electron Builder signing environment variables to produce signed artifacts:

- macOS: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_API_KEY`, `APPLE_API_KEY_ID`,
  `APPLE_API_ISSUER`
- Windows: `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`

The GitHub `Desktop Release` workflow maps repository secrets to those
environment variables and verifies signatures when credentials are present. In
GitHub, store the Apple `.p8` notarization key as `APPLE_API_KEY_BASE64`; the
workflow writes it to a temporary file and exposes the file path as
`APPLE_API_KEY`.

Platform limitations:

- macOS artifacts should be built and smoke-tested on macOS.
- Windows installer artifacts should be built on Windows CI or a Windows host.
- Linux AppImage artifacts should be smoke-tested on the target distro family.
- Cross-platform artifacts can require Electron Builder host dependencies.

Generated packaging output is written under `apps/desktop/release`, which is
ignored by git.

GitHub downloads are produced by the `Desktop Release` workflow when a `v*` tag
is pushed. The workflow uploads installers and `SHA256SUMS.txt` to the matching
GitHub Release.

If GitHub immutable releases are enabled and a release is already published,
do not rerun `Desktop Release` against the same version expecting assets to be
replaced. Publish a new patch tag, for example `v1.0.1`, and let the workflow
create artifacts for that immutable release instead.

## Runtime Settings

Desktop starts the embedded API on `127.0.0.1` with network-adjacent features
disabled:

```env
PROXY_ENABLED=false
PROXY_ALLOWED_HOSTS=
PROXY_ALLOW_PRIVATE_TARGETS=false
MOCK_SERVER_ENABLED=false
TRUST_PROXY=false
```

Users can change safe runtime settings from `Settings -> Desktop runtime`:

- `Mock server`: enables saved local mock routes under `/mock/...`.
- `Proxy mode`: enables restricted proxy execution for explicitly allowed
  hosts.
- `Proxy allowed hosts`: comma-separated host allowlist for proxy requests.
- `Allow private targets`: allows proxy targets that resolve to private
  addresses; keep it off unless testing local/internal APIs intentionally.
- `Default request mode`: chooses Direct Browser Mode or Desktop Proxy for new
  and current requests.
- `Proxy timeout, ms`: desktop proxy request timeout, capped by the application
  limit.
- `Proxy max response, bytes`: desktop proxy response body cap.
- `Mock max response, bytes`: saved mock route response body cap.

Runtime settings are local to the desktop app and are not stored in exported
`.specdock.json` project files.

## Native Filesystem Workflows

Desktop IPC exposes allowlisted operations only:

- open and save portable `.specdock.json` exports
- open and save SpecDock project folders
- write generated SDK files into a user-selected output directory

Project folders store `specdock.project.json` and `openapi.json` separately.
SDK output uses the generated output plan policy from the generator package and
cannot write outside the selected directory.
