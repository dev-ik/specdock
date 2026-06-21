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

## Native Filesystem Workflows

Desktop IPC exposes allowlisted operations only:

- open and save portable `.specdock.json` exports
- open and save SpecDock project folders
- write generated SDK files into a user-selected output directory

Project folders store `specdock.project.json` and `openapi.json` separately.
SDK output uses the generated output plan policy from the generator package and
cannot write outside the selected directory.
