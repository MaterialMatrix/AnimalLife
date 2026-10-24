# AnimalLife

A lightweight 3D animal survival game, built for browser testing on GitHub Pages. First field test: live as a woodland rabbit, forage clover, drink, rest, shelter from a fox, and survive a day.

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
- Pause menu: Resume, Options, Controls, and Save & Exit to title
- Options: graphics quality, mouse sensitivity, and invert vertical look; settings persist locally
- Field guide: a prefilled feedback link to GitHub Issues
- Time controls: 0.5×, 1×, 4×

Progress autosaves locally every five seconds and on interactions. Starting a new life replaces the local save. No accounts, server, telemetry, or multiplayer. Time and aging are accelerated prototype mechanics; eight real minutes at 1× advance a full simulated day. Reloading regenerates world resources and resets fox position.

Life pauses while a dialog is open or the browser loses focus. Graphics preference is stored locally. Low graphics disables shadows and reduces pixel density; it does not change game rules.

## Version 0.2.1

Desktop camera uses the browser Pointer Lock API with relative mouse movement. Escape, opening dialogs, or switching away releases the cursor. The game pauses until capture resumes. Touch controls keep drag and pinch. If an embedded browser blocks pointer lock, an on-screen message suggests opening the game in a regular browser.

## Version 0.2.2

Escape opens a modal pause menu and releases the mouse. Simulation, camera input, camera smoothing, and ambient animation freeze while paused. Resume recaptures the mouse; Options and Controls stay paused. Save & Exit returns to the title screen and makes the saved life available with Continue. Graphics, sensitivity, and invert-look settings are saved locally. Escape in a settings page returns to the main pause menu.

## Version 0.2

Camera-relative movement, smooth acceleration and turning, obstacle sliding with collision substeps, animated ears, mouse-movement camera controls (no click needed), touch drag and pinch, foreground tree hiding, floating landmark labels, a north-up clearing map, low-graphics mode, and a feedback link. Existing version 0.1 saves remain compatible. Added regression tests for camera-relative vectors, diagonal movement, collision tunneling, boundaries, and angle wrapping.

## Field testing

Test movement, food/water interactions, entering/leaving the burrow, the fox chase, time speed, pause, save/continue after reload, and touch controls. Report the browser/device, version, steps, expected behavior, and observed behavior in GitHub Issues.

## Roadmap

Next: refine movement and the camera, replace primitive animal meshes with animated models, expand ecology, improve the day/night cycle, and tune life stages from playtest feedback. A persistent shared world will need a separate backend; GitHub Pages hosts this client only.

## Third-party assets

Three.js 0.180.0 is bundled alongside the game under the MIT license; see `THREE-LICENSE.txt`. Geometry is generated in code. Fonts from Google Fonts have system fallbacks.
