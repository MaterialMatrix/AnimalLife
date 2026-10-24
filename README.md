# AnimalLife

A lightweight 3D animal survival game, built for browser testing on GitHub Pages. Explore a scaled Earth as a rabbit, forage, drink, rest, and find shelter.

## Run locally

Install Node.js, then run `npm start` and open http://127.0.0.1:4173. No install or build step is needed. `npm test` checks survival rules and saved-game validation.

## Publish for free on GitHub Pages

This project is a static website. In the public repository, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, then Save. Future commits to main publish automatically. All asset URLs are relative, including the bundled Three.js dependency, so repository subpaths work.

## Controls

- WASD or arrows: move relative to the camera; Shift: sprint
- E: eat, drink, or enter/leave the burrow
- R: rest/wake; Escape: pause
- Click the game once to capture and hide the mouse; move it to look left/right and up/down without screen-edge limits
- Escape releases the cursor and opens the pause menu; Resume captures it again
- H opens the field guide; opening the guide or map releases the cursor
- Mouse wheel: zoom; C: reset camera
- Touch: drag the scenery to look, pinch to zoom
- M or Map: north-up map with rabbit, clover, pond, burrow, and fox
- P or Earth: rotate the globe, choose real land, and explore a habitat
- Pause menu: Resume, Options, Controls, and Save & Exit to title
- Options: graphics quality, mouse sensitivity, and invert vertical look; settings persist locally
- Field guide: a prefilled feedback link to GitHub Issues
- Time controls: 0.5×, 1×, 4×

Progress autosaves locally every five seconds and on interactions. Habitat origin and position are saved, including migration from earlier clearing saves. Starting a new life replaces the local save. No accounts, server, telemetry, or multiplayer. Time and aging are accelerated prototype mechanics; eight real minutes at 1× advance a full simulated day. Reloading regenerates world resources and resets fox position. Food also regenerates when its terrain tile unloads.

Life pauses while a dialog is open or the browser loses focus. Graphics preference is stored locally. Low graphics disables shadows and reduces pixel density; it does not change game rules.

## Version 0.2.1

Desktop camera uses the browser Pointer Lock API with relative mouse movement. Escape, opening dialogs, or switching away releases the cursor. The game pauses until capture resumes. Touch controls keep drag and pinch. If an embedded browser blocks pointer lock, an on-screen message suggests opening the game in a regular browser.

## Version 0.3: scaled Earth

An interactive 3D Earth with real Natural Earth continent outlines, at roughly 1:1,000 scale (40.03 km circumference). Select land on the globe or one of seven habitat presets. Ocean selections are unavailable to the rabbit. Habitat travel is a prototype shortcut that preserves the current rabbit's needs and age while relocating its home clearing.

The old clearing boundary is removed. Nearby 96 m terrain tiles stream around the player; distant geometry is disposed instead of accumulating. Standard loads up to 25 tiles, Low loads up to 9. Instanced vegetation reduces draw calls. The local map follows the rabbit. Hills, broad biome bands, and resource sites are procedural approximations, not real Earth elevation or ecology. See `EARTH-DATA.md` for provenance and limits.

## Version 0.2.2

Escape opens a modal pause menu and releases the mouse. Simulation, camera input, camera smoothing, and ambient animation freeze while paused. Resume recaptures the mouse; Options and Controls stay paused. Save & Exit returns to the title screen and makes the saved life available with Continue. Graphics, sensitivity, and invert-look settings are saved locally. Escape in a settings page returns to the main pause menu.

## Version 0.2

Camera-relative movement, smooth acceleration and turning, obstacle sliding with collision substeps, animated ears, mouse-movement camera controls (no click needed), touch drag and pinch, foreground tree hiding, floating landmark labels, a north-up clearing map, low-graphics mode, and a feedback link. Existing version 0.1 saves remain compatible. Added regression tests for camera-relative vectors, diagonal movement, collision tunneling, boundaries, and angle wrapping.

## Field testing

Test movement, food/water interactions, entering/leaving the burrow, the fox chase, time speed, pause, save/continue after reload, and touch controls. Report the browser/device, version, steps, expected behavior, and observed behavior in GitHub Issues.

## Roadmap

Next: improve local terrain and water realism, species-appropriate habitats, animated animal models, ecology, seasons, life cycles, and inherited progression. The current game remains single-player. GitHub Pages hosts the static client and geography data.

## Third-party assets

Three.js 0.180.0 is bundled alongside the game under the MIT license; see `THREE-LICENSE.txt`. Geometry is generated in code. Fonts from Google Fonts have system fallbacks.

Real continental coastlines are bundled from Natural Earth's public-domain land dataset. See `EARTH-DATA.md`.
