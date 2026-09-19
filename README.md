# Drive Mad — Jash's Garage

An unofficial mod of this fork's bundled Drive Mad Classic and Plus builds. Original game by Martin Magni / Fancade.

## Play

Serve this folder with any static HTTP server, then open `index.html`. For example, with Node.js installed: `npx --yes http-server . -p 4173`. Open http://localhost:4173. WebAssembly assets require HTTP; opening the HTML as a local file will not work reliably. The site also works beneath a repository subpath on GitHub Pages.

Choose Classic (100 levels) or Plus (200 levels). Press **M** or click **MOD MENU**.

- Jump straight to any level, including levels not yet reached.
- Restart or advance the level most recently selected through the mod menu. These controls do not track progression through the game's own menus.
- Set game speed from 0.25× to 2×.
- **P** freezes/unfreezes the game clock.
- **Q** toggles holding forward. This is auto-drive, not an AI that solves levels. It stops when the window loses focus or the page is hidden.
- Stock, Glacier, Toxic, Violet, Cherry, and Ghost palette skins, plus a custom color picker. Paint persists locally across both editions.
- Reset mods restores stock paint and normal controls without deleting game progress.

## Skin limitations

This repository contains compiled WebAssembly, not the original editable engine or vehicle models. Skins replace yellow material colors in fragment shaders while retaining shading. Matching yellow scenery may also change, and vehicles with other base colors may remain unchanged. These are palette skins, not model replacements or texture uploads. Unsupported shader programs fall back to their original shader.

## Development

`mods/runtime.js` installs palette hooks and a continuous virtual clock before the game loads. Each generated engine file has two small timing hooks, for its monotonic and epoch clocks. `mods/menu.js` uses the exported level-start function with zero-based level indexes. No memory offsets or game binaries are patched. The original basic auto-drive overlay in Plus was replaced.

Run checks: `node --test tests/runtime.test.cjs` and `node --check mods/menu.js`.

No build step or added runtime dependency is required. Existing third-party SDK behavior is inherited from the fork.
