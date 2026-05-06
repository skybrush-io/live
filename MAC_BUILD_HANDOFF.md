# Mac Build Handoff

This repository contains the Skybrush Live changes for single-UAV RC overtake,
Radiomaster/Gamepad input, COM-port selection, and configurable RC channels.

## Current State

- Windows development server was running at `http://localhost:8080/`.
- `npm run type:check` passes on Windows.
- Skybrush Server changes are in the sibling repository `skybrush-server`.
- The Windows packaging attempt was intentionally stopped; continue packaging
  on macOS.

## Required Server Pairing

Use the matching `skybrush-server` commit from this handoff. Important runtime
configuration in `skybrush-server/skybrush.jsonc`:

- MAVLink `system_id` is `255`, matching the working ArduCopter GCS ID.
- MAVLink signing is enabled with the configured 32-byte key.
- `rc` extension is enabled and currently has debug logging enabled.
- RC routing sends overrides through MAVLink connection index `0`.

## Mac Build Steps

From the `skybrush_live` repository on macOS:

```bash
npm install
npm run type:check
npm run bundle
```

Build the Electron main/preload bundles into the packaged app input directory:

```bash
npx webpack --mode=production --config webpack/launcher.config.js --output-path build
npx webpack --mode=production --config webpack/preload.config.js --output-path build
```

Then build the macOS DMG:

```bash
npx electron-builder --config electron-builder.json --mac dmg
```

If `electron-builder` complains that it is not installed, install it as a
development dependency or run via npm:

```bash
npm install --save-dev electron-builder
npx electron-builder --config electron-builder.json --mac dmg
```

Expected artifact:

```text
dist/Skybrush Live 2.13.2.dmg
```

## Verification After Build

1. Start the matching Skybrush Server.
2. Open the packaged Skybrush Live app.
3. Select exactly one UAV.
4. In Settings -> UAVs:
   - RC overtake input: USB joystick or COM port
   - For USB joystick, set `RC channels to send`, for example `1,2,3,4`.
5. Activate RC overtake and verify server logs show:

```text
RC override update: target='01' channels=[...]
Routing RC override to UAV '01' on network mav with MAVLink system ID 1
Enqueuing RC_CHANNELS_OVERRIDE on network mav: target_system=1 channels=[...]
```

6. For ArduCopter, verify RC override works with GCS system ID `255`.
