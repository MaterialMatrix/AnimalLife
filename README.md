# AnimalLife

A lightweight 3D animal survival game, built for browser testing on GitHub Pages. First field test: live as a woodland rabbit, forage clover, drink, rest, shelter from a fox, and survive a day.

## Run locally

Install Node.js, then run `npm start` and open http://127.0.0.1:4173. No install or build step is needed. `npm test` checks survival rules and saved-game validation.

## Publish for free on GitHub Pages

This project is a static website. In the public repository, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, then Save. Future commits to main publish automatically. All asset URLs are relative, including the bundled Three.js dependency, so repository subpaths work.

## Controls

- WASD or arrows: move; Shift: sprint
- E: eat, drink, or enter/leave the burrow
- R: rest/wake; Escape: pause
- Mouse wheel: zoom; on-screen arrows on small screens
- Time controls: 0.5×, 1×, 4×

Progress autosaves locally every five seconds and on interactions. Starting a new life replaces the local save. No accounts, server, telemetry, or multiplayer. Time and aging are accelerated prototype mechanics; eight real minutes at 1× advance a full simulated day. Reloading regenerates world resources and resets fox position.

## Field testing

Test movement, food/water interactions, entering/leaving the burrow, the fox chase, time speed, pause, save/continue after reload, and touch controls. Report the browser/device, version, steps, expected behavior, and observed behavior in GitHub Issues.

## Roadmap

Next: refine movement and the camera, replace primitive animal meshes with animated models, expand ecology, improve the day/night cycle, and tune life stages from playtest feedback. A persistent shared world will need a separate backend; GitHub Pages hosts this client only.

## Third-party assets

Three.js 0.180.0 is bundled alongside the game under the MIT license; see `THREE-LICENSE.txt`. Geometry is generated in code. Fonts from Google Fonts have system fallbacks.
